/**
 * WAN OS Serve Server
 * Implements the complete serve pattern: static frontend → intelligent router → distributed backend
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs-extra';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

import { IntelligentRouter, RoutingRule } from '../router/IntelligentRouter';
import { MockROMRegistry as ROMRegistry } from '../mocks/MockROMRegistry';
import { MockTelemetryService as TelemetryService } from '../mocks/MockTelemetryService';
import { ServeConfig } from '../types/ServeConfig';
import { MiddlewareManager } from './MiddlewareManager';
import { StaticAssetManager } from './StaticAssetManager';
import { BackendProxy } from './BackendProxy';

export class WANOSServeServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private router: IntelligentRouter;
  private romRegistry: ROMRegistry;
  private telemetry: TelemetryService;
  private config: ServeConfig;
  private middlewareManager: MiddlewareManager;
  private staticAssetManager: StaticAssetManager;
  private backendProxy: BackendProxy;
  private isRunning: boolean = false;

  constructor(config: ServeConfig) {
    this.config = config;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors?.origins || "*",
        methods: ["GET", "POST"]
      }
    });

    // Initialize services
    this.romRegistry = new ROMRegistry();
    this.telemetry = new TelemetryService();
    
    // Initialize components
    this.middlewareManager = new MiddlewareManager(config.routing.middleware);
    this.staticAssetManager = new StaticAssetManager(config.serve.frontend);
    this.backendProxy = new BackendProxy(this.telemetry);
    
    // Initialize router
    this.router = new IntelligentRouter({
      romRegistry: this.romRegistry,
      telemetry: this.telemetry,
      routingRules: config.routing.rules,
      healthCheckInterval: config.routing.health_check_interval
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupHealthChecks();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"]
        }
      }
    }));

    // CORS
    if (this.config.cors?.enabled) {
      this.app.use(cors({
        origin: this.config.cors.origins,
        methods: this.config.cors.methods,
        allowedHeaders: this.config.cors.headers
      }));
    }

    // Compression
    if (this.config.serve.frontend.compression) {
      this.app.use(compression({
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
        level: 6
      }));
    }

    // Rate limiting
    this.setupRateLimiting();

    // Custom middleware
    this.middlewareManager.applyMiddleware(this.app);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      this.telemetry.recordRequest({
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent') || undefined,
        ip: req.ip || undefined,
        timestamp: new Date()
      });
      next();
    });
  }

  /**
   * Setup rate limiting
   */
  private setupRateLimiting(): void {
    // Global rate limit
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use(globalLimiter);

    // Route-specific rate limits
    for (const rule of this.config.routing.rules) {
      if (rule.rate_limit && rule.rate_limit !== 'unlimited') {
        const [max, period] = this.parseRateLimit(rule.rate_limit);
        const routeLimiter = rateLimit({
          windowMs: this.parseTimePeriod(period),
          max: max,
          message: `Rate limit exceeded for ${rule.path}`,
          standardHeaders: true,
          legacyHeaders: false
        });

        this.app.use(rule.path, routeLimiter);
      }
    }
  }

  /**
   * Parse rate limit string (e.g., "1000/hour")
   */
  private parseRateLimit(rateLimitStr: string): [number, string] {
    const match = rateLimitStr.match(/^(\d+)\/(\w+)$/);
    if (!match) {
      return [1000, 'hour']; // Default
    }
    return [parseInt(match[1]), match[2]];
  }

  /**
   * Parse time period to milliseconds
   */
  private parseTimePeriod(period: string): number {
    const multipliers: Record<string, number> = {
      'second': 1000,
      'minute': 60 * 1000,
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000
    };
    return multipliers[period] || 60 * 60 * 1000; // Default to hour
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const stats = this.router.getRoutingStats();
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        routing: stats,
        environment: process.env.WANOS_ENV || 'local'
      };

      // Check if we have healthy backends
      if (stats.healthyBackends === 0) {
        health.status = 'unhealthy';
        res.status(503);
      }

      res.json(health);
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      // Check API key if required
      if (this.config.metrics?.authentication === 'api_key') {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey || !this.validateApiKey(apiKey as string)) {
          return res.status(401).json({ error: 'Invalid API key' });
        }
      }

      const metrics = this.telemetry.getMetrics();
      res.json(metrics);
    });

    // ROM registry endpoint
    this.app.get('/registry/health', async (req, res) => {
      try {
        const registryHealth = await this.romRegistry.getRegistryStats();
        res.json({
          status: 'healthy',
          registry: registryHealth,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // API routing - all /api/* requests go through the intelligent router
    this.app.use('/api/*', async (req, res, next) => {
      try {
        const routingDecision = await this.router.routeRequest(
          req.path,
          req.method,
          req.headers as Record<string, string>,
          {
            ip: req.ip,
            region: req.get('x-forwarded-for') ? this.getRegionFromIP(req.ip) : undefined,
            userAgent: req.get('User-Agent')
          }
        );

        // Proxy the request to the selected backend
        await this.backendProxy.proxyRequest(req, res, routingDecision.backend);

      } catch (error) {
        this.telemetry.recordError({
          type: 'routing_error',
          message: error.message,
          path: req.path,
          method: req.method
        });

        res.status(500).json({
          error: 'Internal routing error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // File service routing
    this.app.use('/files/*', async (req, res, next) => {
      try {
        const routingDecision = await this.router.routeRequest(
          req.path,
          req.method,
          req.headers as Record<string, string>
        );

        await this.backendProxy.proxyRequest(req, res, routingDecision.backend);

      } catch (error) {
        res.status(500).json({
          error: 'File service error',
          message: error.message
        });
      }
    });

    // Static file serving - this is the ROM pattern
    this.app.use('/*', async (req, res, next) => {
      try {
        // Try to serve static file first
        const staticFile = await this.staticAssetManager.serveFile(req.path);
        if (staticFile) {
          return res.sendFile(staticFile);
        }

        // If no static file, serve the SPA fallback
        if (this.config.frontend.fallback) {
          const fallbackFile = path.join(this.config.frontend.source, this.config.frontend.fallback);
          if (await fs.pathExists(fallbackFile)) {
            return res.sendFile(fallbackFile);
          }
        }

        // No file found
        res.status(404).json({
          error: 'Not found',
          path: req.path,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        next(error);
      }
    });

    // Error handling middleware
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.telemetry.recordError({
        type: 'server_error',
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup WebSocket for real-time updates
   */
  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      this.telemetry.recordWebSocketConnection({
        id: socket.id,
        timestamp: new Date()
      });

      // Join room for routing updates
      socket.join('routing_updates');

      // Handle client disconnection
      socket.on('disconnect', () => {
        this.telemetry.recordWebSocketDisconnection({
          id: socket.id,
          timestamp: new Date()
        });
      });

      // Handle custom events
      socket.on('subscribe_to_backend', (backendId: string) => {
        socket.join(`backend_${backendId}`);
      });
    });

    // Broadcast routing updates
    setInterval(() => {
      const stats = this.router.getRoutingStats();
      this.io.to('routing_updates').emit('routing_stats', stats);
    }, 5000);
  }

  /**
   * Setup health checks
   */
  private setupHealthChecks(): void {
    if (this.config.health_monitoring?.enabled) {
      for (const check of this.config.health_monitoring.checks) {
        setInterval(async () => {
          try {
            const health = await this.performHealthCheck(check);
            
            // Update telemetry
            this.telemetry.recordHealthCheck({
              name: check.name,
              type: check.type,
              status: health.status,
              response_time: health.response_time,
              timestamp: new Date()
            });

            // Check for alerts
            this.checkHealthAlerts(check, health);

          } catch (error) {
            console.error(`Health check failed for ${check.name}:`, error);
          }
        }, check.interval);
      }
    }
  }

  /**
   * Perform individual health check
   */
  private async performHealthCheck(check: any): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    response_time: number;
  }> {
    const startTime = Date.now();
    
    try {
      let response;
      
      switch (check.type) {
        case 'http':
          response = await fetch(check.endpoint, {
            method: 'GET',
            timeout: check.timeout
          });
          break;
        case 'database':
          // Database health check implementation
          response = { ok: true };
          break;
        default:
          throw new Error(`Unknown health check type: ${check.type}`);
      }

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'healthy',
          response_time: responseTime
        };
      } else {
        return {
          status: 'unhealthy',
          response_time: responseTime
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        response_time: responseTime
      };
    }
  }

  /**
   * Check health alerts
   */
  private checkHealthAlerts(check: any, health: any): void {
    if (this.config.health_monitoring?.alerts) {
      for (const alert of this.config.health_monitoring.alerts) {
        if (alert.condition.includes(check.name)) {
          // Evaluate alert condition
          const shouldAlert = this.evaluateAlertCondition(alert.condition, health);
          
          if (shouldAlert) {
            this.triggerAlert(alert, health);
          }
        }
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateAlertCondition(condition: string, health: any): boolean {
    // Simple condition evaluation - in production, use a proper expression evaluator
    if (condition.includes('status != \'healthy\'')) {
      return health.status !== 'healthy';
    }
    return false;
  }

  /**
   * Trigger alert
   */
  private triggerAlert(alert: any, health: any): void {
    console.log(`ALERT: ${alert.name} - ${alert.severity}`);
    
    // Send notifications
    for (const channel of alert.notification) {
      this.sendNotification(channel, alert, health);
    }
  }

  /**
   * Send notification
   */
  private sendNotification(channel: string, alert: any, health: any): void {
    // Implementation would integrate with actual notification services
    console.log(`Sending ${channel} notification for ${alert.name}`);
  }

  /**
   * Get region from IP address
   */
  private getRegionFromIP(ip: string): string {
    // Simplified implementation - in production, use a proper IP geolocation service
    return 'us-east-1'; // Default
  }

  /**
   * Validate API key
   */
  private validateApiKey(apiKey: string): boolean {
    // Implementation would validate against stored API keys
    return apiKey === process.env.WANOS_API_KEY;
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    try {
      const port = this.config.environments[process.env.WANOS_ENV || 'local']?.config?.port || 3000;
      const host = this.config.environments[process.env.WANOS_ENV || 'local']?.config?.host || 'localhost';

      await new Promise<void>((resolve, reject) => {
        this.server.listen(port, host, () => {
          console.log(`🚀 WAN OS Serve Server running on ${host}:${port}`);
          console.log(`🌍 Environment: ${process.env.WANOS_ENV || 'local'}`);
          console.log(`📊 Health endpoint: http://${host}:${port}/health`);
          console.log(`📈 Metrics endpoint: http://${host}:${port}/metrics`);
          
          this.isRunning = true;
          resolve();
        });

        this.server.on('error', reject);
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          console.log('🛑 WAN OS Serve Server stopped');
          this.isRunning = false;
          resolve();
        });
      });

      // Cleanup resources
      this.router.destroy();
      this.io.close();

    } catch (error) {
      console.error('Error stopping server:', error);
      throw error;
    }
  }

  /**
   * Get server status
   */
  getStatus(): {
    isRunning: boolean;
    uptime: number;
    routingStats: any;
    environment: string;
  } {
    return {
      isRunning: this.isRunning,
      uptime: process.uptime(),
      routingStats: this.router.getRoutingStats(),
      environment: process.env.WANOS_ENV || 'local'
    };
  }
}

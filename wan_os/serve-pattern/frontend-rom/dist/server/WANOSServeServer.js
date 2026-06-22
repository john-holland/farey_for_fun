"use strict";
/**
 * WAN OS Serve Server
 * Implements the complete serve pattern: static frontend → intelligent router → distributed backend
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WANOSServeServer = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
const IntelligentRouter_1 = require("../router/IntelligentRouter");
const MockROMRegistry_1 = require("../mocks/MockROMRegistry");
const MockTelemetryService_1 = require("../mocks/MockTelemetryService");
const MiddlewareManager_1 = require("./MiddlewareManager");
const StaticAssetManager_1 = require("./StaticAssetManager");
const BackendProxy_1 = require("./BackendProxy");
class WANOSServeServer {
    constructor(config) {
        this.isRunning = false;
        this.config = config;
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: config.cors?.origins || "*",
                methods: ["GET", "POST"]
            }
        });
        // Initialize services
        this.romRegistry = new MockROMRegistry_1.MockROMRegistry();
        this.telemetry = new MockTelemetryService_1.MockTelemetryService();
        // Initialize components
        this.middlewareManager = new MiddlewareManager_1.MiddlewareManager(config.routing.middleware);
        this.staticAssetManager = new StaticAssetManager_1.StaticAssetManager(config.serve.frontend);
        this.backendProxy = new BackendProxy_1.BackendProxy(this.telemetry);
        // Initialize router
        this.router = new IntelligentRouter_1.IntelligentRouter({
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
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
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
            this.app.use((0, cors_1.default)({
                origin: this.config.cors.origins,
                methods: this.config.cors.methods,
                allowedHeaders: this.config.cors.headers
            }));
        }
        // Compression
        if (this.config.serve.frontend.compression) {
            this.app.use((0, compression_1.default)({
                filter: (req, res) => {
                    if (req.headers['x-no-compression']) {
                        return false;
                    }
                    return compression_1.default.filter(req, res);
                },
                level: 6
            }));
        }
        // Rate limiting
        this.setupRateLimiting();
        // Custom middleware
        this.middlewareManager.applyMiddleware(this.app);
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
    setupRateLimiting() {
        // Global rate limit
        const globalLimiter = (0, express_rate_limit_1.default)({
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
                const routeLimiter = (0, express_rate_limit_1.default)({
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
    parseRateLimit(rateLimitStr) {
        const match = rateLimitStr.match(/^(\d+)\/(\w+)$/);
        if (!match) {
            return [1000, 'hour']; // Default
        }
        return [parseInt(match[1]), match[2]];
    }
    /**
     * Parse time period to milliseconds
     */
    parseTimePeriod(period) {
        const multipliers = {
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
    setupRoutes() {
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
                if (!apiKey || !this.validateApiKey(apiKey)) {
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
            }
            catch (error) {
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
                const routingDecision = await this.router.routeRequest(req.path, req.method, req.headers, {
                    ip: req.ip,
                    region: req.get('x-forwarded-for') ? this.getRegionFromIP(req.ip) : undefined,
                    userAgent: req.get('User-Agent')
                });
                // Proxy the request to the selected backend
                await this.backendProxy.proxyRequest(req, res, routingDecision.backend);
            }
            catch (error) {
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
                const routingDecision = await this.router.routeRequest(req.path, req.method, req.headers);
                await this.backendProxy.proxyRequest(req, res, routingDecision.backend);
            }
            catch (error) {
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
                    const fallbackFile = path_1.default.join(this.config.frontend.source, this.config.frontend.fallback);
                    if (await fs_extra_1.default.pathExists(fallbackFile)) {
                        return res.sendFile(fallbackFile);
                    }
                }
                // No file found
                res.status(404).json({
                    error: 'Not found',
                    path: req.path,
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Error handling middleware
        this.app.use((error, req, res, next) => {
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
    setupWebSocket() {
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
            socket.on('subscribe_to_backend', (backendId) => {
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
    setupHealthChecks() {
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
                    }
                    catch (error) {
                        console.error(`Health check failed for ${check.name}:`, error);
                    }
                }, check.interval);
            }
        }
    }
    /**
     * Perform individual health check
     */
    async performHealthCheck(check) {
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
            }
            else {
                return {
                    status: 'unhealthy',
                    response_time: responseTime
                };
            }
        }
        catch (error) {
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
    checkHealthAlerts(check, health) {
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
    evaluateAlertCondition(condition, health) {
        // Simple condition evaluation - in production, use a proper expression evaluator
        if (condition.includes('status != \'healthy\'')) {
            return health.status !== 'healthy';
        }
        return false;
    }
    /**
     * Trigger alert
     */
    triggerAlert(alert, health) {
        console.log(`ALERT: ${alert.name} - ${alert.severity}`);
        // Send notifications
        for (const channel of alert.notification) {
            this.sendNotification(channel, alert, health);
        }
    }
    /**
     * Send notification
     */
    sendNotification(channel, alert, health) {
        // Implementation would integrate with actual notification services
        console.log(`Sending ${channel} notification for ${alert.name}`);
    }
    /**
     * Get region from IP address
     */
    getRegionFromIP(ip) {
        // Simplified implementation - in production, use a proper IP geolocation service
        return 'us-east-1'; // Default
    }
    /**
     * Validate API key
     */
    validateApiKey(apiKey) {
        // Implementation would validate against stored API keys
        return apiKey === process.env.WANOS_API_KEY;
    }
    /**
     * Start the server
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Server is already running');
        }
        try {
            const port = this.config.environments[process.env.WANOS_ENV || 'local']?.config?.port || 3000;
            const host = this.config.environments[process.env.WANOS_ENV || 'local']?.config?.host || 'localhost';
            await new Promise((resolve, reject) => {
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
        }
        catch (error) {
            console.error('Failed to start server:', error);
            throw error;
        }
    }
    /**
     * Stop the server
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        try {
            await new Promise((resolve) => {
                this.server.close(() => {
                    console.log('🛑 WAN OS Serve Server stopped');
                    this.isRunning = false;
                    resolve();
                });
            });
            // Cleanup resources
            this.router.destroy();
            this.io.close();
        }
        catch (error) {
            console.error('Error stopping server:', error);
            throw error;
        }
    }
    /**
     * Get server status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            uptime: process.uptime(),
            routingStats: this.router.getRoutingStats(),
            environment: process.env.WANOS_ENV || 'local'
        };
    }
}
exports.WANOSServeServer = WANOSServeServer;
//# sourceMappingURL=WANOSServeServer.js.map
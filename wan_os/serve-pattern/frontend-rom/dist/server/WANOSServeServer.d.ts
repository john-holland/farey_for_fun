/**
 * WAN OS Serve Server
 * Implements the complete serve pattern: static frontend → intelligent router → distributed backend
 */
import { ServeConfig } from '../types/ServeConfig';
export declare class WANOSServeServer {
    private app;
    private server;
    private io;
    private router;
    private romRegistry;
    private telemetry;
    private config;
    private middlewareManager;
    private staticAssetManager;
    private backendProxy;
    private isRunning;
    constructor(config: ServeConfig);
    /**
     * Setup middleware
     */
    private setupMiddleware;
    /**
     * Setup rate limiting
     */
    private setupRateLimiting;
    /**
     * Parse rate limit string (e.g., "1000/hour")
     */
    private parseRateLimit;
    /**
     * Parse time period to milliseconds
     */
    private parseTimePeriod;
    /**
     * Setup routes
     */
    private setupRoutes;
    /**
     * Setup WebSocket for real-time updates
     */
    private setupWebSocket;
    /**
     * Setup health checks
     */
    private setupHealthChecks;
    /**
     * Perform individual health check
     */
    private performHealthCheck;
    /**
     * Check health alerts
     */
    private checkHealthAlerts;
    /**
     * Evaluate alert condition
     */
    private evaluateAlertCondition;
    /**
     * Trigger alert
     */
    private triggerAlert;
    /**
     * Send notification
     */
    private sendNotification;
    /**
     * Get region from IP address
     */
    private getRegionFromIP;
    /**
     * Validate API key
     */
    private validateApiKey;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Stop the server
     */
    stop(): Promise<void>;
    /**
     * Get server status
     */
    getStatus(): {
        isRunning: boolean;
        uptime: number;
        routingStats: any;
        environment: string;
    };
}
//# sourceMappingURL=WANOSServeServer.d.ts.map
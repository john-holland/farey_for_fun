/**
 * WAN OS Middleware Manager
 * Handles custom middleware configuration and application
 */
import { Application } from 'express';
import { MiddlewareConfig } from '../types/ServeConfig';
export declare class MiddlewareManager {
    private middleware;
    constructor(middleware: MiddlewareConfig[]);
    /**
     * Apply all configured middleware to the Express app
     */
    applyMiddleware(app: Application): void;
    /**
     * Apply specific middleware by name
     */
    private applyMiddlewareByName;
    /**
     * Apply CORS middleware
     */
    private applyCorsMiddleware;
    /**
     * Apply compression middleware
     */
    private applyCompressionMiddleware;
    /**
     * Apply telemetry middleware
     */
    private applyTelemetryMiddleware;
    /**
     * Apply security middleware
     */
    private applySecurityMiddleware;
    /**
     * Get middleware configuration
     */
    getMiddleware(): MiddlewareConfig[];
    /**
     * Update middleware configuration
     */
    updateMiddleware(middleware: MiddlewareConfig[]): void;
}
//# sourceMappingURL=MiddlewareManager.d.ts.map
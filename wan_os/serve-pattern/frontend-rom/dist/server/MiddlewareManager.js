"use strict";
/**
 * WAN OS Middleware Manager
 * Handles custom middleware configuration and application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareManager = void 0;
class MiddlewareManager {
    constructor(middleware) {
        this.middleware = middleware;
    }
    /**
     * Apply all configured middleware to the Express app
     */
    applyMiddleware(app) {
        for (const middleware of this.middleware) {
            if (middleware.enabled) {
                this.applyMiddlewareByName(app, middleware);
            }
        }
    }
    /**
     * Apply specific middleware by name
     */
    applyMiddlewareByName(app, middleware) {
        switch (middleware.name) {
            case 'cors':
                this.applyCorsMiddleware(app, middleware);
                break;
            case 'compression':
                this.applyCompressionMiddleware(app, middleware);
                break;
            case 'telemetry':
                this.applyTelemetryMiddleware(app, middleware);
                break;
            case 'security':
                this.applySecurityMiddleware(app, middleware);
                break;
            default:
                console.warn(`Unknown middleware: ${middleware.name}`);
        }
    }
    /**
     * Apply CORS middleware
     */
    applyCorsMiddleware(app, middleware) {
        // CORS is handled by the main server setup
        console.log('CORS middleware configured');
    }
    /**
     * Apply compression middleware
     */
    applyCompressionMiddleware(app, middleware) {
        // Compression is handled by the main server setup
        console.log('Compression middleware configured');
    }
    /**
     * Apply telemetry middleware
     */
    applyTelemetryMiddleware(app, middleware) {
        // Telemetry is handled by the main server setup
        console.log('Telemetry middleware configured');
    }
    /**
     * Apply security middleware
     */
    applySecurityMiddleware(app, middleware) {
        // Security headers are handled by helmet in the main server
        console.log('Security middleware configured');
    }
    /**
     * Get middleware configuration
     */
    getMiddleware() {
        return this.middleware;
    }
    /**
     * Update middleware configuration
     */
    updateMiddleware(middleware) {
        this.middleware = middleware;
    }
}
exports.MiddlewareManager = MiddlewareManager;
//# sourceMappingURL=MiddlewareManager.js.map
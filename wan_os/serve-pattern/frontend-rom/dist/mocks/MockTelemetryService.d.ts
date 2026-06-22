/**
 * Mock Telemetry Service for WAN OS Serve Server
 * Used for testing and development
 */
export declare class MockTelemetryService {
    private metrics;
    private traces;
    private logs;
    /**
     * Record a request
     */
    recordRequest(data: {
        method: string;
        path: string;
        userAgent?: string;
        ip?: string;
        timestamp: Date;
    }): void;
    /**
     * Record a routing decision
     */
    recordRoutingDecision(data: {
        path: string;
        method: string;
        backend: string;
        strategy: string;
        geo_routing: boolean;
        latency: number;
    }): void;
    /**
     * Record a routing error
     */
    recordRoutingError(data: {
        path: string;
        method: string;
        error: string;
    }): void;
    /**
     * Record a health check
     */
    recordHealthCheck(data: {
        url: string;
        status: string;
        latency: number;
        timestamp: Date;
    }): void;
    /**
     * Record a health check error
     */
    recordHealthCheckError(data: {
        url: string;
        error: string;
        timestamp: Date;
    }): void;
    /**
     * Record a WebSocket connection
     */
    recordWebSocketConnection(data: {
        id: string;
        timestamp: Date;
    }): void;
    /**
     * Record a WebSocket disconnection
     */
    recordWebSocketDisconnection(data: {
        id: string;
        timestamp: Date;
    }): void;
    /**
     * Record an error
     */
    recordError(data: {
        type: string;
        message: string;
        stack?: string;
        path?: string;
        method?: string;
    }): void;
    /**
     * Record a proxy request
     */
    recordProxyRequest(data: {
        method: string;
        path: string;
        backend: string;
        responseTime: number;
        statusCode: number;
        timestamp: Date;
    }): void;
    /**
     * Record a proxy error
     */
    recordProxyError(data: {
        method: string;
        path: string;
        backend: string;
        error: string;
        responseTime: number;
        timestamp: Date;
    }): void;
    /**
     * Record a proxy stream
     */
    recordProxyStream(data: {
        method: string;
        path: string;
        backend: string;
        responseTime: number;
        statusCode: number;
        timestamp: Date;
    }): void;
    /**
     * Record a proxy stream error
     */
    recordProxyStreamError(data: {
        method: string;
        path: string;
        backend: string;
        error: string;
        responseTime: number;
        timestamp: Date;
    }): void;
    /**
     * Get all metrics
     */
    getMetrics(): Record<string, any>;
    /**
     * Get all traces
     */
    getTraces(): any[];
    /**
     * Get all logs
     */
    getLogs(): any[];
    /**
     * Clear all data
     */
    clear(): void;
}
//# sourceMappingURL=MockTelemetryService.d.ts.map
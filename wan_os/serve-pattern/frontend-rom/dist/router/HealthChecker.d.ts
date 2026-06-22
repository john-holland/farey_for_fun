/**
 * WAN OS Health Checker
 * Monitors backend health and provides health status information
 */
import { MockTelemetryService as TelemetryService } from '../mocks/MockTelemetryService';
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    load?: number;
    error?: string;
    timestamp: Date;
}
export declare class HealthChecker {
    private telemetry;
    private healthCache;
    private cacheTimeout;
    constructor(telemetry: TelemetryService);
    /**
     * Check health of a backend endpoint
     */
    checkHealth(url: string): Promise<HealthStatus>;
    /**
     * Determine health status based on response data and latency
     */
    private determineHealthStatus;
    /**
     * Batch health check multiple backends
     */
    checkMultipleHealth(urls: string[]): Promise<Map<string, HealthStatus>>;
    /**
     * Get cached health status
     */
    getCachedHealth(url: string): HealthStatus | undefined;
    /**
     * Clear health cache
     */
    clearCache(): void;
    /**
     * Set cache timeout
     */
    setCacheTimeout(timeout: number): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        totalEntries: number;
        validEntries: number;
        expiredEntries: number;
    };
}
//# sourceMappingURL=HealthChecker.d.ts.map
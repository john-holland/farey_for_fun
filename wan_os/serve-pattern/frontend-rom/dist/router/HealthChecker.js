"use strict";
/**
 * WAN OS Health Checker
 * Monitors backend health and provides health status information
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthChecker = void 0;
class HealthChecker {
    constructor(telemetry) {
        this.healthCache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
        this.telemetry = telemetry;
    }
    /**
     * Check health of a backend endpoint
     */
    async checkHealth(url) {
        try {
            // Check cache first
            const cached = this.healthCache.get(url);
            if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
                return cached;
            }
            const startTime = Date.now();
            // Perform health check
            const response = await fetch(`${url}/health`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'WAN-OS-HealthChecker/1.0.0'
                },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            const responseTime = Date.now() - startTime;
            let healthStatus;
            if (response.ok) {
                const healthData = await response.json();
                healthStatus = {
                    status: this.determineHealthStatus(healthData, responseTime),
                    latency: responseTime,
                    load: healthData.load || 0,
                    timestamp: new Date()
                };
            }
            else {
                healthStatus = {
                    status: 'unhealthy',
                    latency: responseTime,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    timestamp: new Date()
                };
            }
            // Cache the result
            this.healthCache.set(url, healthStatus);
            // Record telemetry
            this.telemetry.recordHealthCheck({
                url,
                status: healthStatus.status,
                latency: healthStatus.latency,
                timestamp: healthStatus.timestamp
            });
            return healthStatus;
        }
        catch (error) {
            const errorStatus = {
                status: 'unhealthy',
                latency: -1,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date()
            };
            // Cache the error result
            this.healthCache.set(url, errorStatus);
            // Record telemetry
            this.telemetry.recordHealthCheckError({
                url,
                error: errorStatus.error || 'Unknown error',
                timestamp: errorStatus.timestamp
            });
            return errorStatus;
        }
    }
    /**
     * Determine health status based on response data and latency
     */
    determineHealthStatus(healthData, latency) {
        // Check if the backend reports itself as unhealthy
        if (healthData.status === 'unhealthy') {
            return 'unhealthy';
        }
        // Check latency thresholds
        if (latency > 5000) { // > 5 seconds
            return 'unhealthy';
        }
        else if (latency > 2000) { // > 2 seconds
            return 'degraded';
        }
        // Check load if available
        if (healthData.load !== undefined) {
            if (healthData.load > 0.9) { // > 90% load
                return 'degraded';
            }
        }
        // Check memory usage if available
        if (healthData.memory !== undefined) {
            if (healthData.memory.usage > 0.95) { // > 95% memory usage
                return 'degraded';
            }
        }
        // Check error rate if available
        if (healthData.error_rate !== undefined) {
            if (healthData.error_rate > 0.1) { // > 10% error rate
                return 'degraded';
            }
            else if (healthData.error_rate > 0.05) { // > 5% error rate
                return 'unhealthy';
            }
        }
        return 'healthy';
    }
    /**
     * Batch health check multiple backends
     */
    async checkMultipleHealth(urls) {
        const results = new Map();
        // Check health in parallel
        const healthPromises = urls.map(async (url) => {
            const health = await this.checkHealth(url);
            results.set(url, health);
        });
        await Promise.allSettled(healthPromises);
        return results;
    }
    /**
     * Get cached health status
     */
    getCachedHealth(url) {
        const cached = this.healthCache.get(url);
        if (cached && Date.now() - cached.timestamp.getTime() < this.cacheTimeout) {
            return cached;
        }
        return undefined;
    }
    /**
     * Clear health cache
     */
    clearCache() {
        this.healthCache.clear();
    }
    /**
     * Set cache timeout
     */
    setCacheTimeout(timeout) {
        this.cacheTimeout = timeout;
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;
        for (const entry of this.healthCache.values()) {
            if (now - entry.timestamp.getTime() < this.cacheTimeout) {
                validEntries++;
            }
            else {
                expiredEntries++;
            }
        }
        return {
            totalEntries: this.healthCache.size,
            validEntries,
            expiredEntries
        };
    }
}
exports.HealthChecker = HealthChecker;
//# sourceMappingURL=HealthChecker.js.map
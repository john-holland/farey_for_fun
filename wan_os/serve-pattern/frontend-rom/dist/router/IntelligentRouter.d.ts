/**
 * WAN OS Intelligent Router
 * Handles routing from static frontend to distributed backends
 * Implements the serve pattern for seamless frontend-backend integration
 */
import { MockROMRegistry as ROMRegistry } from '../mocks/MockROMRegistry';
import { MockTelemetryService as TelemetryService } from '../mocks/MockTelemetryService';
export interface RoutingRule {
    path: string;
    backend: string;
    methods: string[];
    authentication: 'required' | 'optional' | 'none';
    rate_limit: string;
    middleware?: string[];
}
export interface BackendInstance {
    id: string;
    name: string;
    url: string;
    type: 'distributed' | 'internal' | 'mock';
    health: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    region: string;
    zone: string;
    capabilities: string[];
    load: number;
    last_health_check: Date;
}
export interface RoutingDecision {
    backend: BackendInstance;
    route: RoutingRule;
    load_balancing_strategy: string;
    geo_routing: boolean;
    latency_based: boolean;
    circuit_breaker: boolean;
}
export declare class IntelligentRouter {
    private romRegistry;
    private telemetry;
    private healthChecker;
    private loadBalancer;
    private circuitBreaker;
    private geoRouter;
    private routingRules;
    private backendInstances;
    private healthCheckInterval;
    constructor(config: {
        romRegistry: ROMRegistry;
        telemetry: TelemetryService;
        routingRules: RoutingRule[];
        healthCheckInterval?: number;
    });
    /**
     * Route a request to the appropriate backend
     */
    routeRequest(path: string, method: string, headers: Record<string, string>, clientInfo?: {
        ip: string;
        region?: string;
        userAgent?: string;
    }): Promise<RoutingDecision>;
    /**
     * Find matching routing rule
     */
    private findMatchingRoute;
    /**
     * Get backends for a specific route
     */
    private getBackendsForRoute;
    /**
     * Get ROM deployments
     */
    private getROMDeployments;
    /**
     * Make intelligent routing decision
     */
    private makeRoutingDecision;
    /**
     * Check if geo-routing should be used
     */
    private shouldUseGeoRouting;
    /**
     * Check if latency-based routing should be used
     */
    private shouldUseLatencyRouting;
    /**
     * Start health checking
     */
    private startHealthChecking;
    /**
     * Perform health checks on all backends
     */
    private performHealthChecks;
    /**
     * Get routing statistics
     */
    getRoutingStats(): {
        totalRoutes: number;
        totalBackends: number;
        healthyBackends: number;
        unhealthyBackends: number;
        circuitBrokenBackends: number;
    };
    /**
     * Update routing rules
     */
    updateRoutingRules(rules: RoutingRule[]): void;
    /**
     * Add backend instance
     */
    addBackendInstance(backendName: string, instance: BackendInstance): void;
    /**
     * Remove backend instance
     */
    removeBackendInstance(backendName: string, instanceId: string): void;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
//# sourceMappingURL=IntelligentRouter.d.ts.map
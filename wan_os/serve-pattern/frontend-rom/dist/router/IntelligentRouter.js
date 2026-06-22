"use strict";
/**
 * WAN OS Intelligent Router
 * Handles routing from static frontend to distributed backends
 * Implements the serve pattern for seamless frontend-backend integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligentRouter = void 0;
const HealthChecker_1 = require("./HealthChecker");
const LoadBalancer_1 = require("./LoadBalancer");
const CircuitBreaker_1 = require("./CircuitBreaker");
const GeoRouter_1 = require("./GeoRouter");
class IntelligentRouter {
    constructor(config) {
        this.romRegistry = config.romRegistry;
        this.telemetry = config.telemetry;
        this.routingRules = config.routingRules;
        this.backendInstances = new Map();
        this.healthChecker = new HealthChecker_1.HealthChecker(config.telemetry);
        this.loadBalancer = new LoadBalancer_1.LoadBalancer();
        this.circuitBreaker = new CircuitBreaker_1.CircuitBreaker();
        this.geoRouter = new GeoRouter_1.GeoRouter();
        // Start health checking
        this.startHealthChecking(config.healthCheckInterval || 30000);
    }
    /**
     * Route a request to the appropriate backend
     */
    async routeRequest(path, method, headers, clientInfo) {
        try {
            // Find matching routing rule
            const route = this.findMatchingRoute(path, method);
            if (!route) {
                throw new Error(`No route found for ${method} ${path}`);
            }
            // Get available backends for this route
            const backends = await this.getBackendsForRoute(route.backend);
            if (!backends || backends.length === 0) {
                throw new Error(`No backends available for ${route.backend}`);
            }
            // Filter healthy backends
            const healthyBackends = backends.filter(b => b.health !== 'unhealthy');
            if (healthyBackends.length === 0) {
                throw new Error(`No healthy backends available for ${route.backend}`);
            }
            // Apply circuit breaker
            const availableBackends = healthyBackends.filter(b => !this.circuitBreaker.isOpen(b.id));
            if (availableBackends.length === 0) {
                // All backends are circuit broken, try to reset
                this.circuitBreaker.resetAll();
                return this.routeRequest(path, method, headers, clientInfo);
            }
            // Make routing decision
            const decision = await this.makeRoutingDecision(route, availableBackends, clientInfo);
            // Record telemetry
            this.telemetry.recordRoutingDecision({
                path,
                method,
                backend: decision.backend.id,
                strategy: decision.load_balancing_strategy,
                geo_routing: decision.geo_routing,
                latency: decision.backend.latency
            });
            return decision;
        }
        catch (error) {
            this.telemetry.recordRoutingError({
                path,
                method,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Find matching routing rule
     */
    findMatchingRoute(path, method) {
        return this.routingRules.find(rule => {
            // Convert path pattern to regex
            const pathPattern = rule.path
                .replace(/\*/g, '.*')
                .replace(/\/\//g, '/');
            const pathRegex = new RegExp(`^${pathPattern}$`);
            return pathRegex.test(path) && rule.methods.includes(method);
        }) || null;
    }
    /**
     * Get backends for a specific route
     */
    async getBackendsForRoute(backendName) {
        // Check if we have cached instances
        if (this.backendInstances.has(backendName)) {
            return this.backendInstances.get(backendName) || [];
        }
        // Discover backends from ROM registry
        try {
            const roms = await this.romRegistry.searchROMs(backendName, {
                type: 'backend',
                environment: process.env['WANOS_ENV'] || 'local'
            });
            const instances = [];
            for (const rom of roms) {
                const romInfo = await this.romRegistry.getROMInfo(rom.id);
                // Check if ROM provides the required backend service
                if (romInfo.capabilities.includes(backendName)) {
                    // Get deployment instances for this ROM
                    const deployments = await this.getROMDeployments(rom.id);
                    for (const deployment of deployments) {
                        instances.push({
                            id: `${rom.id}-${deployment.id}`,
                            name: rom.name,
                            url: deployment.url,
                            type: deployment.type,
                            health: 'healthy', // Will be updated by health checker
                            latency: 0,
                            region: deployment.region,
                            zone: deployment.zone,
                            capabilities: romInfo.capabilities,
                            load: 0,
                            last_health_check: new Date()
                        });
                    }
                }
            }
            // Cache the instances
            this.backendInstances.set(backendName, instances);
            return instances;
        }
        catch (error) {
            console.error(`Failed to discover backends for ${backendName}:`, error);
            return [];
        }
    }
    /**
     * Get ROM deployments
     */
    async getROMDeployments(romId) {
        // This would typically query the ROM registry for deployment information
        // For now, return mock data
        return [
            {
                id: 'deployment-1',
                url: `https://${romId}.wanos.cloud`,
                type: 'distributed',
                region: 'us-east-1',
                zone: 'production'
            }
        ];
    }
    /**
     * Make intelligent routing decision
     */
    async makeRoutingDecision(route, backends, clientInfo) {
        let selectedBackend;
        let strategy = 'default';
        // 1. Geo-routing (if enabled and client region is known)
        if (clientInfo?.region && this.shouldUseGeoRouting(route)) {
            const geoBackends = this.geoRouter.routeByRegion(backends, clientInfo.region);
            if (geoBackends.length > 0) {
                selectedBackend = this.loadBalancer.select(geoBackends, 'round_robin');
                strategy = 'geo_routing';
            }
        }
        // 2. Latency-based routing (if enabled)
        if (!selectedBackend && this.shouldUseLatencyRouting(route)) {
            selectedBackend = this.loadBalancer.select(backends, 'least_latency');
            strategy = 'latency_based';
        }
        // 3. Health-based routing
        if (!selectedBackend) {
            const healthyBackends = backends.filter(b => b.health === 'healthy');
            if (healthyBackends.length > 0) {
                selectedBackend = this.loadBalancer.select(healthyBackends, 'least_connections');
                strategy = 'health_based';
            }
        }
        // 4. Fallback to any available backend
        if (!selectedBackend) {
            selectedBackend = this.loadBalancer.select(backends, 'round_robin');
            strategy = 'fallback';
        }
        return {
            backend: selectedBackend,
            route,
            load_balancing_strategy: strategy,
            geo_routing: strategy === 'geo_routing',
            latency_based: strategy === 'latency_based',
            circuit_breaker: false
        };
    }
    /**
     * Check if geo-routing should be used
     */
    shouldUseGeoRouting(route) {
        // Check route configuration or global settings
        return true; // Simplified for now
    }
    /**
     * Check if latency-based routing should be used
     */
    shouldUseLatencyRouting(route) {
        // Check route configuration or global settings
        return true; // Simplified for now
    }
    /**
     * Start health checking
     */
    startHealthChecking(interval) {
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, interval);
    }
    /**
     * Perform health checks on all backends
     */
    async performHealthChecks() {
        for (const [backendName, instances] of this.backendInstances) {
            for (const instance of instances) {
                try {
                    const health = await this.healthChecker.checkHealth(instance.url);
                    // Update instance health
                    instance.health = health.status;
                    instance.latency = health.latency;
                    instance.load = health.load || 0;
                    instance.last_health_check = new Date();
                    // Update circuit breaker
                    if (health.status === 'unhealthy') {
                        this.circuitBreaker.recordFailure(instance.id);
                    }
                    else {
                        this.circuitBreaker.recordSuccess(instance.id);
                    }
                }
                catch (error) {
                    console.error(`Health check failed for ${instance.id}:`, error);
                    instance.health = 'unhealthy';
                    this.circuitBreaker.recordFailure(instance.id);
                }
            }
        }
    }
    /**
     * Get routing statistics
     */
    getRoutingStats() {
        let totalBackends = 0;
        let healthyBackends = 0;
        let unhealthyBackends = 0;
        let circuitBrokenBackends = 0;
        for (const instances of this.backendInstances.values()) {
            totalBackends += instances.length;
            for (const instance of instances) {
                if (instance.health === 'healthy') {
                    healthyBackends++;
                }
                else if (instance.health === 'unhealthy') {
                    unhealthyBackends++;
                }
                if (this.circuitBreaker.isOpen(instance.id)) {
                    circuitBrokenBackends++;
                }
            }
        }
        return {
            totalRoutes: this.routingRules.length,
            totalBackends,
            healthyBackends,
            unhealthyBackends,
            circuitBrokenBackends
        };
    }
    /**
     * Update routing rules
     */
    updateRoutingRules(rules) {
        this.routingRules = rules;
    }
    /**
     * Add backend instance
     */
    addBackendInstance(backendName, instance) {
        if (!this.backendInstances.has(backendName)) {
            this.backendInstances.set(backendName, []);
        }
        this.backendInstances.get(backendName).push(instance);
    }
    /**
     * Remove backend instance
     */
    removeBackendInstance(backendName, instanceId) {
        const instances = this.backendInstances.get(backendName);
        if (instances) {
            const index = instances.findIndex(i => i.id === instanceId);
            if (index !== -1) {
                instances.splice(index, 1);
            }
        }
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
    }
}
exports.IntelligentRouter = IntelligentRouter;
//# sourceMappingURL=IntelligentRouter.js.map
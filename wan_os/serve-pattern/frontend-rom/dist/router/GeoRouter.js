"use strict";
/**
 * WAN OS Geo Router
 * Handles geographic routing based on client location and backend regions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoRouter = void 0;
class GeoRouter {
    constructor() {
        this.regionMapping = new Map();
        this.latencyMatrix = new Map();
        this.initializeRegionMapping();
    }
    /**
     * Initialize region mapping for geographic routing
     */
    initializeRegionMapping() {
        // North America
        this.regionMapping.set('us-east-1', ['us-east-1', 'us-east-2', 'ca-central-1']);
        this.regionMapping.set('us-west-1', ['us-west-1', 'us-west-2', 'ca-central-1']);
        this.regionMapping.set('us-west-2', ['us-west-2', 'us-west-1', 'ca-central-1']);
        this.regionMapping.set('ca-central-1', ['ca-central-1', 'us-east-1', 'us-west-2']);
        // Europe
        this.regionMapping.set('eu-west-1', ['eu-west-1', 'eu-west-2', 'eu-central-1']);
        this.regionMapping.set('eu-west-2', ['eu-west-2', 'eu-west-1', 'eu-central-1']);
        this.regionMapping.set('eu-central-1', ['eu-central-1', 'eu-west-1', 'eu-west-2']);
        this.regionMapping.set('eu-north-1', ['eu-north-1', 'eu-central-1', 'eu-west-1']);
        // Asia Pacific
        this.regionMapping.set('ap-southeast-1', ['ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1']);
        this.regionMapping.set('ap-southeast-2', ['ap-southeast-2', 'ap-southeast-1', 'ap-northeast-1']);
        this.regionMapping.set('ap-northeast-1', ['ap-northeast-1', 'ap-southeast-1', 'ap-southeast-2']);
        this.regionMapping.set('ap-south-1', ['ap-south-1', 'ap-southeast-1', 'ap-southeast-2']);
        // South America
        this.regionMapping.set('sa-east-1', ['sa-east-1', 'us-east-1', 'us-east-2']);
        // Africa
        this.regionMapping.set('af-south-1', ['af-south-1', 'eu-west-1', 'eu-central-1']);
        // Middle East
        this.regionMapping.set('me-south-1', ['me-south-1', 'eu-west-1', 'ap-south-1']);
    }
    /**
     * Route backends by geographic region
     */
    routeByRegion(backends, clientRegion) {
        // Get preferred regions for the client
        const preferredRegions = this.regionMapping.get(clientRegion) || [clientRegion];
        // Group backends by region preference
        const groupedBackends = [];
        for (const region of preferredRegions) {
            const regionBackends = backends.filter(b => b.region === region);
            if (regionBackends.length > 0) {
                groupedBackends.push(regionBackends);
            }
        }
        // Flatten the grouped backends (preferred regions first)
        return groupedBackends.flat();
    }
    /**
     * Route backends by latency to client region
     */
    routeByLatency(backends, clientRegion) {
        // Get latency matrix for the client region
        const regionLatencies = this.latencyMatrix.get(clientRegion);
        if (!regionLatencies) {
            // Fall back to region-based routing
            return this.routeByRegion(backends, clientRegion);
        }
        // Sort backends by latency to client region
        return [...backends].sort((a, b) => {
            const latencyA = regionLatencies.get(a.region) || 999;
            const latencyB = regionLatencies.get(b.region) || 999;
            return latencyA - latencyB;
        });
    }
    /**
     * Get optimal backend based on geographic proximity
     */
    getOptimalBackend(backends, clientLocation) {
        if (backends.length === 0) {
            return null;
        }
        // First, try to find backends in the same region
        const sameRegionBackends = backends.filter(b => b.region === clientLocation.region);
        if (sameRegionBackends.length > 0) {
            // Return the healthiest backend in the same region
            return this.getHealthiestBackend(sameRegionBackends);
        }
        // If no backends in the same region, find the closest healthy backend
        const healthyBackends = backends.filter(b => b.health === 'healthy');
        if (healthyBackends.length === 0) {
            return null;
        }
        // Use region-based routing as fallback
        const routedBackends = this.routeByRegion(healthyBackends, clientLocation.region);
        return routedBackends[0] || null;
    }
    /**
     * Get the healthiest backend from a list
     */
    getHealthiestBackend(backends) {
        return backends.reduce((healthiest, current) => {
            if (current.health === 'healthy' && healthiest.health !== 'healthy') {
                return current;
            }
            if (current.health === healthiest.health) {
                // If both have same health, prefer the one with lower latency
                return current.latency < healthiest.latency ? current : healthiest;
            }
            return healthiest;
        });
    }
    /**
     * Update latency matrix for a region
     */
    updateLatencyMatrix(region, latencies) {
        if (!this.latencyMatrix.has(region)) {
            this.latencyMatrix.set(region, new Map());
        }
        const regionMatrix = this.latencyMatrix.get(region);
        for (const [targetRegion, latency] of Object.entries(latencies)) {
            regionMatrix.set(targetRegion, latency);
        }
    }
    /**
     * Get latency between two regions
     */
    getLatency(fromRegion, toRegion) {
        const regionMatrix = this.latencyMatrix.get(fromRegion);
        if (!regionMatrix) {
            return null;
        }
        return regionMatrix.get(toRegion) || null;
    }
    /**
     * Get all regions
     */
    getRegions() {
        return Array.from(this.regionMapping.keys());
    }
    /**
     * Get preferred regions for a client region
     */
    getPreferredRegions(clientRegion) {
        return this.regionMapping.get(clientRegion) || [clientRegion];
    }
    /**
     * Add custom region mapping
     */
    addRegionMapping(clientRegion, preferredRegions) {
        this.regionMapping.set(clientRegion, preferredRegions);
    }
    /**
     * Get routing statistics
     */
    getStats() {
        let totalLatencyEntries = 0;
        for (const matrix of this.latencyMatrix.values()) {
            totalLatencyEntries += matrix.size;
        }
        const regionMappings = {};
        for (const [region, preferred] of this.regionMapping) {
            regionMappings[region] = preferred;
        }
        return {
            totalRegions: this.regionMapping.size,
            totalLatencyEntries,
            regionMappings
        };
    }
}
exports.GeoRouter = GeoRouter;
//# sourceMappingURL=GeoRouter.js.map
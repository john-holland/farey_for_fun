"use strict";
/**
 * WAN OS Load Balancer
 * Implements various load balancing strategies for backend selection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadBalancer = void 0;
class LoadBalancer {
    constructor() {
        this.roundRobinIndex = new Map();
        this.connectionCounts = new Map();
    }
    /**
     * Select a backend using the specified strategy
     */
    select(backends, strategy) {
        if (backends.length === 0) {
            throw new Error('No backends available for load balancing');
        }
        if (backends.length === 1) {
            return backends[0];
        }
        switch (strategy) {
            case 'round_robin':
                return this.roundRobin(backends);
            case 'least_connections':
                return this.leastConnections(backends);
            case 'least_latency':
                return this.leastLatency(backends);
            case 'weighted_round_robin':
                return this.weightedRoundRobin(backends);
            case 'ip_hash':
                return this.ipHash(backends);
            case 'random':
                return this.random(backends);
            default:
                return this.roundRobin(backends);
        }
    }
    /**
     * Round-robin load balancing
     */
    roundRobin(backends) {
        const key = this.getBackendKey(backends);
        const currentIndex = this.roundRobinIndex.get(key) || 0;
        const selectedBackend = backends[currentIndex % backends.length];
        // Update index for next selection
        this.roundRobinIndex.set(key, (currentIndex + 1) % backends.length);
        return selectedBackend;
    }
    /**
     * Least connections load balancing
     */
    leastConnections(backends) {
        return backends.reduce((min, current) => {
            const minConnections = this.connectionCounts.get(min.id) || 0;
            const currentConnections = this.connectionCounts.get(current.id) || 0;
            return currentConnections < minConnections ? current : min;
        });
    }
    /**
     * Least latency load balancing
     */
    leastLatency(backends) {
        return backends.reduce((min, current) => {
            return current.latency < min.latency ? current : min;
        });
    }
    /**
     * Weighted round-robin load balancing
     */
    weightedRoundRobin(backends) {
        // For now, use simple round-robin
        // In the future, this could consider backend capacity, performance, etc.
        return this.roundRobin(backends);
    }
    /**
     * IP hash load balancing
     */
    ipHash(backends) {
        // For now, use random selection
        // In the future, this could hash the client IP for consistent routing
        return this.random(backends);
    }
    /**
     * Random load balancing
     */
    random(backends) {
        const randomIndex = Math.floor(Math.random() * backends.length);
        return backends[randomIndex];
    }
    /**
     * Get a unique key for a set of backends
     */
    getBackendKey(backends) {
        return backends.map(b => b.id).sort().join('|');
    }
    /**
     * Record a connection to a backend
     */
    recordConnection(backendId) {
        const currentCount = this.connectionCounts.get(backendId) || 0;
        this.connectionCounts.set(backendId, currentCount + 1);
    }
    /**
     * Record a disconnection from a backend
     */
    recordDisconnection(backendId) {
        const currentCount = this.connectionCounts.get(backendId) || 0;
        if (currentCount > 0) {
            this.connectionCounts.set(backendId, currentCount - 1);
        }
    }
    /**
     * Get connection counts for all backends
     */
    getConnectionCounts() {
        return new Map(this.connectionCounts);
    }
    /**
     * Reset connection counts
     */
    resetConnectionCounts() {
        this.connectionCounts.clear();
    }
    /**
     * Get load balancer statistics
     */
    getStats() {
        const totalConnections = Array.from(this.connectionCounts.values()).reduce((sum, count) => sum + count, 0);
        const backendConnections = {};
        for (const [backendId, count] of this.connectionCounts) {
            backendConnections[backendId] = count;
        }
        const roundRobinIndices = {};
        for (const [key, index] of this.roundRobinIndex) {
            roundRobinIndices[key] = index;
        }
        return {
            totalConnections,
            backendConnections,
            roundRobinIndices
        };
    }
}
exports.LoadBalancer = LoadBalancer;
//# sourceMappingURL=LoadBalancer.js.map
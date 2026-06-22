/**
 * WAN OS Load Balancer
 * Implements various load balancing strategies for backend selection
 */
import { BackendInstance } from './IntelligentRouter';
export type LoadBalancingStrategy = 'round_robin' | 'least_connections' | 'least_latency' | 'weighted_round_robin' | 'ip_hash' | 'random';
export declare class LoadBalancer {
    private roundRobinIndex;
    private connectionCounts;
    /**
     * Select a backend using the specified strategy
     */
    select(backends: BackendInstance[], strategy: LoadBalancingStrategy): BackendInstance;
    /**
     * Round-robin load balancing
     */
    private roundRobin;
    /**
     * Least connections load balancing
     */
    private leastConnections;
    /**
     * Least latency load balancing
     */
    private leastLatency;
    /**
     * Weighted round-robin load balancing
     */
    private weightedRoundRobin;
    /**
     * IP hash load balancing
     */
    private ipHash;
    /**
     * Random load balancing
     */
    private random;
    /**
     * Get a unique key for a set of backends
     */
    private getBackendKey;
    /**
     * Record a connection to a backend
     */
    recordConnection(backendId: string): void;
    /**
     * Record a disconnection from a backend
     */
    recordDisconnection(backendId: string): void;
    /**
     * Get connection counts for all backends
     */
    getConnectionCounts(): Map<string, number>;
    /**
     * Reset connection counts
     */
    resetConnectionCounts(): void;
    /**
     * Get load balancer statistics
     */
    getStats(): {
        totalConnections: number;
        backendConnections: Record<string, number>;
        roundRobinIndices: Record<string, number>;
    };
}
//# sourceMappingURL=LoadBalancer.d.ts.map
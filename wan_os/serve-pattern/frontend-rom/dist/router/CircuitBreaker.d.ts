/**
 * WAN OS Circuit Breaker
 * Implements the circuit breaker pattern to prevent cascade failures
 */
export declare class CircuitBreaker {
    private failures;
    private lastFailureTime;
    private state;
    private failureThreshold;
    private recoveryTimeout;
    private halfOpenMaxRequests;
    private readonly halfOpenRequestCount;
    constructor(config?: {
        failureThreshold?: number;
        recoveryTimeout?: number;
        halfOpenMaxRequests?: number;
    });
    /**
     * Check if circuit breaker is open for a backend
     */
    isOpen(backendId: string): boolean;
    /**
     * Record a successful request
     */
    recordSuccess(backendId: string): void;
    /**
     * Record a failed request
     */
    recordFailure(backendId: string): void;
    /**
     * Check if a request can be made (circuit breaker logic)
     */
    canMakeRequest(backendId: string): boolean;
    /**
     * Reset circuit breaker for a specific backend
     */
    reset(backendId: string): void;
    /**
     * Reset all circuit breakers
     */
    resetAll(): void;
    /**
     * Get circuit breaker state for a backend
     */
    getState(backendId: string): {
        state: 'closed' | 'open' | 'half_open';
        failures: number;
        lastFailureTime: number | null;
        halfOpenRequestCount: number;
    };
    /**
     * Get statistics for all circuit breakers
     */
    getStats(): {
        totalBackends: number;
        closedBackends: number;
        openBackends: number;
        halfOpenBackends: number;
        backendStates: Record<string, {
            state: 'closed' | 'open' | 'half_open';
            failures: number;
            lastFailureTime: number | null;
        }>;
    };
    /**
     * Update circuit breaker configuration
     */
    updateConfig(config: {
        failureThreshold?: number;
        recoveryTimeout?: number;
        halfOpenMaxRequests?: number;
    }): void;
}
//# sourceMappingURL=CircuitBreaker.d.ts.map
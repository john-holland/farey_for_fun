"use strict";
/**
 * WAN OS Circuit Breaker
 * Implements the circuit breaker pattern to prevent cascade failures
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
class CircuitBreaker {
    constructor(config) {
        this.failures = new Map();
        this.lastFailureTime = new Map();
        this.state = new Map();
        this.failureThreshold = 5;
        this.recoveryTimeout = 30000; // 30 seconds
        this.halfOpenMaxRequests = 3;
        this.halfOpenRequestCount = new Map();
        if (config?.failureThreshold)
            this.failureThreshold = config.failureThreshold;
        if (config?.recoveryTimeout)
            this.recoveryTimeout = config.recoveryTimeout;
        if (config?.halfOpenMaxRequests)
            this.halfOpenMaxRequests = config.halfOpenMaxRequests;
    }
    /**
     * Check if circuit breaker is open for a backend
     */
    isOpen(backendId) {
        const currentState = this.state.get(backendId) || 'closed';
        return currentState === 'open';
    }
    /**
     * Record a successful request
     */
    recordSuccess(backendId) {
        // Reset failure count
        this.failures.set(backendId, 0);
        // If in half-open state, transition to closed
        if (this.state.get(backendId) === 'half_open') {
            this.state.set(backendId, 'closed');
            this.halfOpenRequestCount.set(backendId, 0);
        }
    }
    /**
     * Record a failed request
     */
    recordFailure(backendId) {
        const currentFailures = this.failures.get(backendId) || 0;
        const newFailures = currentFailures + 1;
        this.failures.set(backendId, newFailures);
        this.lastFailureTime.set(backendId, Date.now());
        // Check if we should open the circuit
        if (newFailures >= this.failureThreshold) {
            this.state.set(backendId, 'open');
            console.log(`Circuit breaker opened for ${backendId} after ${newFailures} failures`);
        }
    }
    /**
     * Check if a request can be made (circuit breaker logic)
     */
    canMakeRequest(backendId) {
        const currentState = this.state.get(backendId) || 'closed';
        switch (currentState) {
            case 'closed':
                return true;
            case 'open':
                // Check if recovery timeout has passed
                const lastFailure = this.lastFailureTime.get(backendId) || 0;
                if (Date.now() - lastFailure > this.recoveryTimeout) {
                    // Transition to half-open state
                    this.state.set(backendId, 'half_open');
                    this.halfOpenRequestCount.set(backendId, 0);
                    console.log(`Circuit breaker for ${backendId} transitioning to half-open state`);
                    return true;
                }
                return false;
            case 'half_open':
                // Allow limited requests in half-open state
                const currentCount = this.halfOpenRequestCount.get(backendId) || 0;
                if (currentCount < this.halfOpenMaxRequests) {
                    this.halfOpenRequestCount.set(backendId, currentCount + 1);
                    return true;
                }
                return false;
            default:
                return true;
        }
    }
    /**
     * Reset circuit breaker for a specific backend
     */
    reset(backendId) {
        this.state.set(backendId, 'closed');
        this.failures.set(backendId, 0);
        this.lastFailureTime.delete(backendId);
        this.halfOpenRequestCount.set(backendId, 0);
        console.log(`Circuit breaker reset for ${backendId}`);
    }
    /**
     * Reset all circuit breakers
     */
    resetAll() {
        this.state.clear();
        this.failures.clear();
        this.lastFailureTime.clear();
        this.halfOpenRequestCount.clear();
        console.log('All circuit breakers reset');
    }
    /**
     * Get circuit breaker state for a backend
     */
    getState(backendId) {
        return {
            state: this.state.get(backendId) || 'closed',
            failures: this.failures.get(backendId) || 0,
            lastFailureTime: this.lastFailureTime.get(backendId) || null,
            halfOpenRequestCount: this.halfOpenRequestCount.get(backendId) || 0
        };
    }
    /**
     * Get statistics for all circuit breakers
     */
    getStats() {
        let closedCount = 0;
        let openCount = 0;
        let halfOpenCount = 0;
        const backendStates = {};
        for (const [backendId, state] of this.state) {
            const backendState = this.getState(backendId);
            backendStates[backendId] = backendState;
            switch (state) {
                case 'closed':
                    closedCount++;
                    break;
                case 'open':
                    openCount++;
                    break;
                case 'half_open':
                    halfOpenCount++;
                    break;
            }
        }
        return {
            totalBackends: this.state.size,
            closedBackends: closedCount,
            openBackends: openCount,
            halfOpenBackends: halfOpenCount,
            backendStates
        };
    }
    /**
     * Update circuit breaker configuration
     */
    updateConfig(config) {
        if (config.failureThreshold !== undefined) {
            this.failureThreshold = config.failureThreshold;
        }
        if (config.recoveryTimeout !== undefined) {
            this.recoveryTimeout = config.recoveryTimeout;
        }
        if (config.halfOpenMaxRequests !== undefined) {
            this.halfOpenMaxRequests = config.halfOpenMaxRequests;
        }
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=CircuitBreaker.js.map
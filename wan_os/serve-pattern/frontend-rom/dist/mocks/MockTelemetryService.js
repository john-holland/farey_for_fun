"use strict";
/**
 * Mock Telemetry Service for WAN OS Serve Server
 * Used for testing and development
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockTelemetryService = void 0;
class MockTelemetryService {
    constructor() {
        this.metrics = new Map();
        this.traces = [];
        this.logs = [];
    }
    /**
     * Record a request
     */
    recordRequest(data) {
        console.log('📊 Mock Telemetry - Request:', data);
        this.metrics.set(`request_${data.method}_${data.path}`, data);
    }
    /**
     * Record a routing decision
     */
    recordRoutingDecision(data) {
        console.log('🔄 Mock Telemetry - Routing Decision:', data);
        this.metrics.set(`routing_${data.path}`, data);
    }
    /**
     * Record a routing error
     */
    recordRoutingError(data) {
        console.log('❌ Mock Telemetry - Routing Error:', data);
        this.metrics.set(`routing_error_${data.path}`, data);
    }
    /**
     * Record a health check
     */
    recordHealthCheck(data) {
        console.log('🏥 Mock Telemetry - Health Check:', data);
        this.metrics.set(`health_${data.url}`, data);
    }
    /**
     * Record a health check error
     */
    recordHealthCheckError(data) {
        console.log('💥 Mock Telemetry - Health Check Error:', data);
        this.metrics.set(`health_error_${data.url}`, data);
    }
    /**
     * Record a WebSocket connection
     */
    recordWebSocketConnection(data) {
        console.log('🔌 Mock Telemetry - WebSocket Connection:', data);
        this.metrics.set(`websocket_${data.id}`, data);
    }
    /**
     * Record a WebSocket disconnection
     */
    recordWebSocketDisconnection(data) {
        console.log('🔌 Mock Telemetry - WebSocket Disconnection:', data);
        this.metrics.set(`websocket_disconnect_${data.id}`, data);
    }
    /**
     * Record an error
     */
    recordError(data) {
        console.log('💥 Mock Telemetry - Error:', data);
        this.metrics.set(`error_${data.type}`, data);
    }
    /**
     * Record a proxy request
     */
    recordProxyRequest(data) {
        console.log('🔄 Mock Telemetry - Proxy Request:', data);
        this.metrics.set(`proxy_${data.backend}`, data);
    }
    /**
     * Record a proxy error
     */
    recordProxyError(data) {
        console.log('❌ Mock Telemetry - Proxy Error:', data);
        this.metrics.set(`proxy_error_${data.backend}`, data);
    }
    /**
     * Record a proxy stream
     */
    recordProxyStream(data) {
        console.log('🌊 Mock Telemetry - Proxy Stream:', data);
        this.metrics.set(`proxy_stream_${data.backend}`, data);
    }
    /**
     * Record a proxy stream error
     */
    recordProxyStreamError(data) {
        console.log('💥 Mock Telemetry - Proxy Stream Error:', data);
        this.metrics.set(`proxy_stream_error_${data.backend}`, data);
    }
    /**
     * Get all metrics
     */
    getMetrics() {
        const result = {};
        for (const [key, value] of this.metrics) {
            result[key] = value;
        }
        return result;
    }
    /**
     * Get all traces
     */
    getTraces() {
        return this.traces;
    }
    /**
     * Get all logs
     */
    getLogs() {
        return this.logs;
    }
    /**
     * Clear all data
     */
    clear() {
        this.metrics.clear();
        this.traces = [];
        this.logs = [];
    }
}
exports.MockTelemetryService = MockTelemetryService;
//# sourceMappingURL=MockTelemetryService.js.map
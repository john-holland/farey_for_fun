/**
 * Mock Telemetry Service for WAN OS Serve Server
 * Used for testing and development
 */

export class MockTelemetryService {
  private metrics: Map<string, any> = new Map();
  private traces: any[] = [];
  private logs: any[] = [];

  /**
   * Record a request
   */
  recordRequest(data: {
    method: string;
    path: string;
    userAgent?: string;
    ip?: string;
    timestamp: Date;
  }): void {
    console.log('📊 Mock Telemetry - Request:', data);
    this.metrics.set(`request_${data.method}_${data.path}`, data);
  }

  /**
   * Record a routing decision
   */
  recordRoutingDecision(data: {
    path: string;
    method: string;
    backend: string;
    strategy: string;
    geo_routing: boolean;
    latency: number;
  }): void {
    console.log('🔄 Mock Telemetry - Routing Decision:', data);
    this.metrics.set(`routing_${data.path}`, data);
  }

  /**
   * Record a routing error
   */
  recordRoutingError(data: {
    path: string;
    method: string;
    error: string;
  }): void {
    console.log('❌ Mock Telemetry - Routing Error:', data);
    this.metrics.set(`routing_error_${data.path}`, data);
  }

  /**
   * Record a health check
   */
  recordHealthCheck(data: {
    url: string;
    status: string;
    latency: number;
    timestamp: Date;
  }): void {
    console.log('🏥 Mock Telemetry - Health Check:', data);
    this.metrics.set(`health_${data.url}`, data);
  }

  /**
   * Record a health check error
   */
  recordHealthCheckError(data: {
    url: string;
    error: string;
    timestamp: Date;
  }): void {
    console.log('💥 Mock Telemetry - Health Check Error:', data);
    this.metrics.set(`health_error_${data.url}`, data);
  }

  /**
   * Record a WebSocket connection
   */
  recordWebSocketConnection(data: {
    id: string;
    timestamp: Date;
  }): void {
    console.log('🔌 Mock Telemetry - WebSocket Connection:', data);
    this.metrics.set(`websocket_${data.id}`, data);
  }

  /**
   * Record a WebSocket disconnection
   */
  recordWebSocketDisconnection(data: {
    id: string;
    timestamp: Date;
  }): void {
    console.log('🔌 Mock Telemetry - WebSocket Disconnection:', data);
    this.metrics.set(`websocket_disconnect_${data.id}`, data);
  }

  /**
   * Record an error
   */
  recordError(data: {
    type: string;
    message: string;
    stack?: string;
    path?: string;
    method?: string;
  }): void {
    console.log('💥 Mock Telemetry - Error:', data);
    this.metrics.set(`error_${data.type}`, data);
  }

  /**
   * Record a proxy request
   */
  recordProxyRequest(data: {
    method: string;
    path: string;
    backend: string;
    responseTime: number;
    statusCode: number;
    timestamp: Date;
  }): void {
    console.log('🔄 Mock Telemetry - Proxy Request:', data);
    this.metrics.set(`proxy_${data.backend}`, data);
  }

  /**
   * Record a proxy error
   */
  recordProxyError(data: {
    method: string;
    path: string;
    backend: string;
    error: string;
    responseTime: number;
    timestamp: Date;
  }): void {
    console.log('❌ Mock Telemetry - Proxy Error:', data);
    this.metrics.set(`proxy_error_${data.backend}`, data);
  }

  /**
   * Record a proxy stream
   */
  recordProxyStream(data: {
    method: string;
    path: string;
    backend: string;
    responseTime: number;
    statusCode: number;
    timestamp: Date;
  }): void {
    console.log('🌊 Mock Telemetry - Proxy Stream:', data);
    this.metrics.set(`proxy_stream_${data.backend}`, data);
  }

  /**
   * Record a proxy stream error
   */
  recordProxyStreamError(data: {
    method: string;
    path: string;
    backend: string;
    error: string;
    responseTime: number;
    timestamp: Date;
  }): void {
    console.log('💥 Mock Telemetry - Proxy Stream Error:', data);
    this.metrics.set(`proxy_stream_error_${data.backend}`, data);
  }

  /**
   * Get all metrics
   */
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.metrics) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Get all traces
   */
  getTraces(): any[] {
    return this.traces;
  }

  /**
   * Get all logs
   */
  getLogs(): any[] {
    return this.logs;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.metrics.clear();
    this.traces = [];
    this.logs = [];
  }
}

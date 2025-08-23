/**
 * WAN OS Serve Configuration Types
 */

export interface ServeConfig {
  metadata: {
    name: string;
    version: string;
    description: string;
    author: string;
    created_at: string;
  };
  serve: {
    mode: 'distributed' | 'local' | 'hybrid';
    frontend: FrontendConfig;
    backend: BackendConfig;
    routing: RoutingConfig;
  };
  environments: Record<string, EnvironmentConfig>;
  routing: {
    rules: RoutingRule[];
    middleware: MiddlewareConfig[];
    health_check_interval: number;
  };
  cors?: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    headers: string[];
  };
  cdn: CDNConfig;
  health_monitoring?: HealthMonitoringConfig;
  telemetry: TelemetryConfig;
  performance: PerformanceConfig;
  security: SecurityConfig;
  metrics?: {
    authentication: 'none' | 'api_key' | 'oauth2';
  };
}

export interface FrontendConfig {
  type: 'static' | 'spa' | 'ssr';
  source: string;
  fallback?: string;
  compression: boolean;
  minification: boolean;
  cache_control: CacheControlConfig;
}

export interface BackendConfig {
  type: 'distributed' | 'internal' | 'mock';
  discovery: 'rom_registry' | 'ldap' | 'internal_registry' | 'global_registry';
  load_balancing: 'health_based' | 'round_robin' | 'least_connections';
  failover: 'automatic' | 'manual';
  circuit_breaker: CircuitBreakerConfig;
}

export interface RoutingConfig {
  strategy: 'intelligent' | 'simple' | 'advanced';
  health_check_interval: number;
  sticky_sessions: boolean;
  geo_routing: boolean;
  latency_based: boolean;
}

export interface EnvironmentConfig {
  enabled: boolean;
  description: string;
  config: {
    port: number;
    host: string;
    ssl?: boolean;
    backend_mock?: boolean;
    telemetry_level?: string;
    cdn_enabled?: boolean;
    internal_network?: boolean;
    vpn_required?: boolean;
    public_monitoring?: boolean;
    caching?: boolean;
  };
  backends: BackendInstanceConfig[];
}

export interface BackendInstanceConfig {
  name: string;
  url?: string;
  discovery: string;
  type: string;
  health_check: string;
  load_balancing?: string;
  authentication?: string;
  audit_logging?: boolean;
  geo_routing?: boolean;
  latency_based?: boolean;
  herd_immunity?: boolean;
}

export interface RoutingRule {
  path: string;
  backend: string;
  methods: string[];
  authentication: 'required' | 'optional' | 'none';
  rate_limit: string;
  middleware?: string[];
}

export interface MiddlewareConfig {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface CDNConfig {
  enabled: boolean;
  provider: string;
  edge_locations: string[];
  cache_headers: CacheControlConfig;
  compression: CompressionConfig;
}

export interface CacheControlConfig {
  static_assets: string;
  html_files: string;
  api_responses: string;
}

export interface CompressionConfig {
  enabled: boolean;
  algorithms: string[];
  min_size: number;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failure_threshold: number;
  recovery_timeout: number;
}

export interface HealthMonitoringConfig {
  enabled: boolean;
  checks: HealthCheck[];
  alerts: HealthAlert[];
}

export interface HealthCheck {
  name: string;
  type: string;
  endpoint: string;
  interval: number;
  timeout: number;
  retries: number;
}

export interface HealthAlert {
  name: string;
  condition: string;
  severity: string;
  notification: string[];
}

export interface TelemetryConfig {
  enabled: boolean;
  endpoint: string;
  service_name: string;
  service_version: string;
  metrics: string[];
  traces: string[];
  logs: string[];
}

export interface PerformanceConfig {
  optimizations: string[];
  benchmarks: Record<string, BenchmarkConfig>;
}

export interface BenchmarkConfig {
  target: string;
  acceptable: string;
}

export interface SecurityConfig {
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  encryption: EncryptionConfig;
  headers: SecurityHeadersConfig;
}

export interface AuthenticationConfig {
  enabled: boolean;
  methods: string[];
  session_management: boolean;
}

export interface AuthorizationConfig {
  enabled: boolean;
  role_based: boolean;
  permission_matrix: boolean;
}

export interface EncryptionConfig {
  tls: string;
  cipher_suites: string[];
}

export interface SecurityHeadersConfig {
  security_headers: boolean;
  csp: boolean;
  hsts: boolean;
  x_frame_options: boolean;
}

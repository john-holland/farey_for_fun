"use strict";
/**
 * WAN OS Serve Pattern Example Server
 * Demonstrates the ROM pattern with mock services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveConfig = void 0;
exports.main = main;
const WANOSServeServer_1 = require("./server/WANOSServeServer");
const MockTelemetryService_1 = require("./mocks/MockTelemetryService");
const MockROMRegistry_1 = require("./mocks/MockROMRegistry");
// Create mock services
const mockTelemetry = new MockTelemetryService_1.MockTelemetryService();
const mockROMRegistry = new MockROMRegistry_1.MockROMRegistry();
// Create serve configuration
const serveConfig = {
    metadata: {
        name: "WAN OS Frontend Serve Example",
        version: "1.0.0",
        description: "Example server demonstrating the serve pattern",
        author: "WAN OS Team",
        created_at: new Date().toISOString()
    },
    serve: {
        mode: "distributed",
        frontend: {
            type: "static",
            source: "./dist",
            fallback: "index.html",
            compression: true,
            minification: true,
            cache_control: {
                static_assets: "public, max-age=31536000",
                html_files: "public, max-age=3600",
                api_responses: "private, max-age=300"
            }
        },
        backend: {
            type: "distributed",
            discovery: "rom_registry",
            load_balancing: "health_based",
            failover: "automatic",
            circuit_breaker: {
                enabled: true,
                failure_threshold: 5,
                recovery_timeout: 30000
            }
        },
        routing: {
            strategy: "intelligent",
            health_check_interval: 30000,
            sticky_sessions: false,
            geo_routing: true,
            latency_based: true
        }
    },
    environments: {
        local: {
            enabled: true,
            description: "Local development with mock backends",
            config: {
                port: 3000,
                host: "localhost",
                backend_mock: true,
                telemetry_level: "debug",
                caching: false
            },
            backends: [
                {
                    name: "local-api",
                    url: "http://localhost:8080",
                    type: "mock",
                    discovery: "local",
                    health_check: "/health"
                }
            ]
        }
    },
    routing: {
        rules: [
            {
                path: "/api/*",
                backend: "api-cluster",
                methods: ["GET", "POST", "PUT", "DELETE"],
                authentication: "required",
                rate_limit: "1000/hour"
            },
            {
                path: "/files/*",
                backend: "file-service",
                methods: ["GET", "POST", "PUT", "DELETE"],
                authentication: "required",
                rate_limit: "100/hour"
            },
            {
                path: "/health",
                backend: "health-checker",
                methods: ["GET"],
                authentication: "none",
                rate_limit: "unlimited"
            },
            {
                path: "/metrics",
                backend: "monitoring-service",
                methods: ["GET"],
                authentication: "required",
                rate_limit: "100/hour"
            },
            {
                path: "/*",
                backend: "static-files",
                methods: ["GET"],
                authentication: "none",
                rate_limit: "unlimited"
            }
        ],
        middleware: [
            {
                name: "cors",
                enabled: true,
                config: {
                    origins: ["*"],
                    methods: ["GET", "POST", "PUT", "DELETE"],
                    headers: ["Content-Type", "Authorization"]
                }
            },
            {
                name: "compression",
                enabled: true,
                config: {
                    algorithms: ["gzip", "brotli"],
                    threshold: 1024
                }
            },
            {
                name: "telemetry",
                enabled: true,
                config: {
                    metrics: true,
                    tracing: true,
                    logging: true
                }
            },
            {
                name: "security",
                enabled: true,
                config: {
                    helmet: true,
                    rate_limiting: true,
                    csp: true
                }
            }
        ],
        health_check_interval: 30000
    },
    cors: {
        enabled: true,
        origins: ["*"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        headers: ["Content-Type", "Authorization"]
    },
    cdn: {
        enabled: false,
        provider: "local",
        edge_locations: [],
        cache_headers: {
            static_assets: "public, max-age=31536000, immutable",
            html_files: "public, max-age=3600",
            api_responses: "private, max-age=300"
        },
        compression: {
            enabled: true,
            algorithms: ["gzip", "brotli"],
            min_size: 1024
        }
    },
    health_monitoring: {
        enabled: true,
        checks: [
            {
                name: "backend_health",
                type: "http",
                endpoint: "/health",
                interval: 30000,
                timeout: 5000,
                retries: 3
            }
        ],
        alerts: [
            {
                name: "backend_unhealthy",
                condition: "backend_health.status != 'healthy'",
                severity: "critical",
                notification: ["console"]
            }
        ]
    },
    telemetry: {
        enabled: true,
        endpoint: "http://localhost:4317",
        service_name: "wanos-frontend-rom-example",
        service_version: "1.0.0",
        metrics: [
            "request_count",
            "response_time",
            "error_rate",
            "backend_health"
        ],
        traces: [
            "request_flow",
            "backend_routing"
        ],
        logs: [
            "access_logs",
            "error_logs"
        ]
    },
    performance: {
        optimizations: [
            "static_asset_caching",
            "compression",
            "minification"
        ],
        benchmarks: {
            static_serving: {
                target: "1000 req/s",
                acceptable: "500 req/s"
            },
            api_routing: {
                target: "100 req/s",
                acceptable: "50 req/s"
            }
        }
    },
    security: {
        authentication: {
            enabled: false,
            methods: ["none"],
            session_management: false
        },
        authorization: {
            enabled: false,
            role_based: false,
            permission_matrix: false
        },
        encryption: {
            tls: "1.3",
            cipher_suites: ["TLS_AES_256_GCM_SHA384"]
        },
        headers: {
            security_headers: true,
            csp: true,
            hsts: false,
            x_frame_options: true
        }
    }
};
exports.serveConfig = serveConfig;
// Create and start the server
async function main() {
    try {
        console.log('🚀 Starting WAN OS Serve Pattern Example Server...');
        console.log('📁 Configuration:', serveConfig.metadata.name);
        console.log('🌍 Environment: local');
        console.log('🔧 Mode: distributed');
        // Create the serve server
        const server = new WANOSServeServer_1.WANOSServeServer(serveConfig);
        // Start the server
        await server.start();
        console.log('\n✅ Server started successfully!');
        console.log('📊 Health endpoint: http://localhost:3000/health');
        console.log('📈 Metrics endpoint: http://localhost:3000/metrics');
        console.log('🔍 Registry health: http://localhost:3000/registry/health');
        console.log('\n🌐 Try these endpoints:');
        console.log('   - http://localhost:3000/ (static files)');
        console.log('   - http://localhost:3000/api/test (API routing)');
        console.log('   - http://localhost:3000/files/test (file service)');
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down server...');
            await server.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down server...');
            await server.stop();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server if this file is run directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=example-server.js.map
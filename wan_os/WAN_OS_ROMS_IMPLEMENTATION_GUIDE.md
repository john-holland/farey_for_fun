# WAN OS ROMs Implementation Guide

> **For Cursor Instances**: This guide provides a complete walkthrough for implementing WAN OS ROMs (Read-Only Modules) with the serve pattern architecture. Use this as your reference to avoid missing critical aspects.

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Implementation Checklist](#implementation-checklist)
4. [Package Structure](#package-structure)
5. [Serve Pattern Architecture](#serve-pattern-architecture)
6. [Persistence System](#persistence-system)
7. [Telemetry Integration](#telemetry-integration)
8. [Deployment Configurations](#deployment-configurations)
9. [Testing Strategy](#testing-strategy)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

## Overview

WAN OS ROMs (Read-Only Modules) are distributed, immutable, shared components that implement the **serve pattern** - a static frontend to distributed backend architecture. This pattern enables:

- **Static Frontend ROMs**: Served from CDN with intelligent routing
- **Distributed Backends**: Multiple backend services with health monitoring
- **Intelligent Routing**: Smart backend selection based on health, latency, and load
- **Persistence**: State management across ROM instances
- **Telemetry**: Comprehensive monitoring and observability

## Core Concepts

### ROM Types
- **Frontend ROM**: Static assets (HTML, CSS, JS) served to clients
- **Backend ROM**: API services with business logic
- **Service ROM**: Specialized services (file processing, authentication, etc.)

### Serve Pattern Components
- **Intelligent Router**: Makes routing decisions based on multiple factors
- **Backend Proxy**: Forwards requests to selected backends
- **Static Asset Manager**: Serves frontend ROM files
- **Circuit Breaker**: Prevents cascade failures
- **Health Checker**: Monitors backend availability

## Implementation Checklist

Before starting, ensure you have:

- [ ] Node.js and npm installed
- [ ] TypeScript development environment
- [ ] Understanding of Express.js basics
- [ ] Access to OpenTelemetry endpoints (if using telemetry)

### Required Steps
1. [ ] Create npm package with `@wanos-rom/{module-name}` naming
2. [ ] Set up TypeScript configuration
3. [ ] Implement serve pattern architecture
4. [ ] Add persistence system
5. [ ] Integrate telemetry (OpenTelemetry)
6. [ ] Configure deployment environments
7. [ ] Set up health checks and monitoring
8. [ ] Implement ROM registry integration
9. [ ] Add configuration-driven features
10. [ ] Test all components thoroughly

## Package Structure

### Required Files
```
wanos-rom/{module-name}/
├── package.json                 # npm package configuration
├── tsconfig.json               # TypeScript configuration
├── wanos-serve.json            # Serve pattern configuration
├── src/                        # Source code
│   ├── server/                 # Server components
│   ├── router/                 # Routing logic
│   ├── types/                  # TypeScript type definitions
│   └── mocks/                  # Mock services for development
├── dist/                       # Compiled output
└── README.md                   # Documentation
```

### package.json Structure
```json
{
  "name": "@wanos-rom/{module-name}",
  "version": "1.0.0",
  "description": "WAN OS ROM for {module-name}",
  "main": "dist/simple-server.js",
  "scripts": {
    "build": "tsc",
    "build:dev": "tsc --watch",
    "serve": "node dist/simple-server.js",
    "serve:dev": "ts-node src/simple-server.ts",
    "dev": "concurrently \"npm run build:dev\" \"npm run serve:dev\"",
    "start": "npm run build && npm run serve"
  },
  "dependencies": {
    "express": "^4.18.0",
    "fs-extra": "^11.0.0",
    "socket.io": "^4.7.0",
    "compression": "^1.7.0",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.0.0",
    "cors": "^2.8.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "concurrently": "^8.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Serve Pattern Architecture

### 1. Simple Server (Recommended for Starters)
Start with a basic Express server that demonstrates core concepts:

```typescript
// src/simple-server.ts
import express from 'express';
import path from 'path';
import fs from 'fs-extra';

// Simple persistence system
class SimplePersistence {
  private dataPath: string;
  private data: { counter: number; lastUpdated: string };

  constructor() {
    this.dataPath = path.join(__dirname, '../data/persistence.json');
    this.data = { counter: 0, lastUpdated: new Date().toISOString() };
    this.loadData();
  }

  // ... persistence methods
}

const app = express();
const persistence = new SimplePersistence();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Persistence endpoints
app.get('/persistence/counter', async (req, res) => {
  // ... implementation
});

app.post('/persistence/counter/increment', async (req, res) => {
  // ... implementation
});

// Start server
app.listen(3000, () => {
  console.log('🚀 WAN OS ROM Server Started!');
});
```

### 2. Full WANOSServeServer (Production Ready)
For production deployments, implement the complete architecture:

```typescript
// src/server/WANOSServeServer.ts
import { IntelligentRouter } from '../router/IntelligentRouter';
import { BackendProxy } from './BackendProxy';
import { StaticAssetManager } from './StaticAssetManager';

export class WANOSServeServer {
  private router: IntelligentRouter;
  private proxy: BackendProxy;
  private staticManager: StaticAssetManager;

  constructor(config: ServeConfig) {
    this.router = new IntelligentRouter(config);
    this.proxy = new BackendProxy(config);
    this.staticManager = new StaticAssetManager(config);
  }

  // ... server implementation
}
```

## Persistence System

### Implementation Pattern
```typescript
class SimplePersistence {
  private dataPath: string;
  private data: any;

  constructor() {
    this.dataPath = path.join(__dirname, '../data/persistence.json');
    this.data = {};
    this.loadData();
  }

  private async loadData() {
    try {
      await fs.ensureDir(path.dirname(this.dataPath));
      
      if (await fs.pathExists(this.dataPath)) {
        const fileData = await fs.readJson(this.dataPath);
        this.data = { ...this.data, ...fileData };
      } else {
        await this.saveData();
      }
    } catch (error) {
      console.error('Error loading persistence data:', error);
    }
  }

  private async saveData() {
    try {
      this.data.lastUpdated = new Date().toISOString();
      await fs.writeJson(this.dataPath, this.data, { spaces: 2 });
    } catch (error) {
      console.error('Error saving persistence data:', error);
    }
  }

  // Public methods
  async getData(): Promise<any> { return this.data; }
  async setData(data: any): Promise<void> { 
    this.data = { ...this.data, ...data };
    await this.saveData();
  }
}
```

### Key Features
- **Automatic Data Directory Creation**: Uses `fs-extra.ensureDir()`
- **JSON File Storage**: Human-readable persistence format
- **Timestamp Tracking**: Automatic last-updated timestamps
- **Error Handling**: Graceful fallbacks for file operations
- **Data Merging**: Preserves existing data when updating

## Telemetry Integration

### OpenTelemetry Setup
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'wanos-rom',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),
});

sdk.start();
```

### Health Endpoints
Implement these essential endpoints:

```typescript
// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.WANOS_ENV || 'local'
  });
});

// Metrics
app.get('/metrics', (req, res) => {
  res.json({
    requests: telemetry.getRequestCount(),
    errors: telemetry.getErrorCount(),
    timestamp: new Date().toISOString()
  });
});

// Registry health
app.get('/registry/health', async (req, res) => {
  try {
    const stats = await romRegistry.getRegistryStats();
    res.json({ status: 'healthy', registry: stats });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: 'Registry unavailable' });
  }
});
```

## Deployment Configurations

### Environment-Specific Configs
Create `wanos-serve.json` with environment configurations:

```json
{
  "metadata": {
    "name": "wanos-frontend-rom",
    "version": "1.0.0",
    "description": "Frontend ROM with serve pattern"
  },
  "environments": {
    "local": {
      "config": {
        "port": 3000,
        "host": "localhost"
      },
      "backends": [
        {
          "name": "local-api",
          "url": "http://localhost:3001",
          "discovery": "local"
        }
      ]
    },
    "vendor": {
      "config": {
        "port": 8080,
        "host": "0.0.0.0"
      },
      "backends": [
        {
          "name": "vendor-api",
          "url": "${VENDOR_API_URL}",
          "discovery": "distributed"
        }
      ]
    },
    "enterprise": {
      "config": {
        "port": 8080,
        "host": "0.0.0.0"
      },
      "backends": [
        {
          "name": "enterprise-api",
          "url": "${ENTERPRISE_API_URL}",
          "discovery": "internal"
        }
      ]
    },
    "public": {
      "config": {
        "port": 80,
        "host": "0.0.0.0"
      },
      "backends": [
        {
          "name": "public-api",
          "url": "${PUBLIC_API_URL}",
          "discovery": "distributed"
        }
      ]
    }
  }
}
```

### Environment Variables
Set these for different deployments:

```bash
# Local Development
WANOS_ENV=local
PORT=3000
HOST=localhost

# Vendor Deployment
WANOS_ENV=vendor
VENDOR_API_URL=https://api.vendor.com
TELEMETRY_ENDPOINT=https://telemetry.vendor.com

# Enterprise Deployment
WANOS_ENV=enterprise
ENTERPRISE_API_URL=https://api.enterprise.com
LDAP_URL=ldap://ldap.enterprise.com
OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}

# Public Deployment
WANOS_ENV=public
PUBLIC_API_URL=https://api.public.com
TELEMETRY_ENDPOINT=https://telemetry.public.com
```

## Testing Strategy

### 1. Unit Tests
Test individual components in isolation:

```typescript
// src/__tests__/persistence.test.ts
import { SimplePersistence } from '../server/SimplePersistence';

describe('SimplePersistence', () => {
  let persistence: SimplePersistence;

  beforeEach(() => {
    persistence = new SimplePersistence();
  });

  test('should increment counter', async () => {
    const initial = await persistence.getCounter();
    const result = await persistence.incrementCounter();
    expect(result).toBe(initial + 1);
  });
});
```

### 2. Integration Tests
Test component interactions:

```typescript
// src/__tests__/server.test.ts
import request from 'supertest';
import { app } from '../simple-server';

describe('Server Integration', () => {
  test('should serve health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

  test('should increment counter', async () => {
    const response = await request(app)
      .post('/persistence/counter/increment')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.counter).toBeGreaterThan(0);
  });
});
```

### 3. End-to-End Tests
Test complete request flows:

```typescript
// src/__tests__/e2e.test.ts
describe('End-to-End Flow', () => {
  test('should handle complete request flow', async () => {
    // 1. Check health
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);

    // 2. Increment counter
    const increment = await request(app)
      .post('/persistence/counter/increment');
    expect(increment.status).toBe(200);

    // 3. Verify counter
    const counter = await request(app).get('/persistence/counter');
    expect(counter.body.counter).toBe(increment.body.counter);
  });
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. TypeScript Compilation Errors
**Problem**: Type errors during build
**Solution**: 
- Check `tsconfig.json` configuration
- Verify type definitions are installed
- Use `--skipLibCheck` for development

#### 2. Routing Failures
**Problem**: API requests not reaching backends
**Solution**:
- Verify backend health checks
- Check circuit breaker settings
- Ensure backend URLs are correct

#### 3. Persistence Errors
**Problem**: Data not saving or loading
**Solution**:
- Check file permissions
- Verify data directory exists
- Ensure `fs-extra` is installed

#### 4. Telemetry Failures
**Problem**: OpenTelemetry not working
**Solution**:
- Verify endpoint configuration
- Check network connectivity
- Ensure OpenTelemetry SDK is properly initialized

### Debugging Steps
1. **Check Server Logs**: Look for error messages and stack traces
2. **Verify Environment Variables**: Ensure all required vars are set
3. **Test Individual Endpoints**: Use curl or Postman to test each endpoint
4. **Check File System**: Verify paths and permissions
5. **Network Connectivity**: Test external service connections

## Best Practices

### Architecture
- **Start Simple**: Begin with basic server and add complexity gradually
- **Mock Services**: Use mock services for development and testing
- **Health Checks**: Implement health checks for all components
- **Fail Fast**: Design for failure with circuit breakers and fallbacks

### Development
- **TypeScript**: Use TypeScript for type safety and better development experience
- **Error Handling**: Implement proper error handling and logging
- **Testing**: Test frequently with different scenarios
- **Documentation**: Document configuration and deployment steps

### Deployment
- **Environment Configs**: Use environment-specific configurations
- **Security**: Implement proper security measures (rate limiting, CORS, etc.)
- **Monitoring**: Monitor performance and health continuously
- **Scaling**: Plan for scaling and load balancing from the start

### Performance
- **Caching**: Implement appropriate caching strategies
- **Compression**: Use compression middleware for responses
- **Rate Limiting**: Protect against abuse with rate limiting
- **Load Balancing**: Distribute load across multiple backends

## Quick Start Template

### 1. Create Project Structure
```bash
mkdir wanos-rom-example
cd wanos-rom-example
npm init -y
```

### 2. Install Dependencies
```bash
npm install express fs-extra
npm install -D typescript ts-node @types/node
```

### 3. Create Basic Server
```typescript
// src/server.ts
import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log('🚀 WAN OS ROM Server Started!');
});
```

### 4. Build and Run
```bash
npx tsc src/server.ts --outDir dist --target ES2020 --module commonjs
node dist/server.js
```

## Conclusion

This guide covers the essential aspects of implementing WAN OS ROMs. Remember to:

1. **Start Simple**: Begin with basic functionality and add features incrementally
2. **Test Thoroughly**: Test each component individually and as part of the system
3. **Monitor Everything**: Implement comprehensive logging and telemetry
4. **Plan for Scale**: Design with scalability and failure handling in mind
5. **Document Decisions**: Keep track of architectural decisions and their rationale

For additional help, refer to the cursor-coda.yaml file which contains structured guidance for Cursor instances implementing WAN OS ROMs.

---

**Note for Cursor Instances**: This guide is designed to be comprehensive and avoid missing critical implementation details. Use the implementation checklist and refer to the specific sections as needed during development.

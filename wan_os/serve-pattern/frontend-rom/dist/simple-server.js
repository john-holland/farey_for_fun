"use strict";
/**
 * Simple WAN OS Serve Pattern Example Server
 * Demonstrates the ROM pattern with basic functionality
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// Simple persistence system
class SimplePersistence {
    constructor() {
        this.dataPath = path_1.default.join(__dirname, '../data/persistence.json');
        this.data = { counter: 0, lastUpdated: new Date().toISOString() };
        this.loadData();
    }
    async loadData() {
        try {
            // Ensure data directory exists
            await fs_extra_1.default.ensureDir(path_1.default.dirname(this.dataPath));
            if (await fs_extra_1.default.pathExists(this.dataPath)) {
                const fileData = await fs_extra_1.default.readJson(this.dataPath);
                this.data = { ...this.data, ...fileData };
                console.log('📁 Loaded persistence data:', this.data);
            }
            else {
                await this.saveData();
                console.log('📁 Created new persistence file');
            }
        }
        catch (error) {
            console.error('❌ Error loading persistence data:', error);
        }
    }
    async saveData() {
        try {
            this.data.lastUpdated = new Date().toISOString();
            await fs_extra_1.default.writeJson(this.dataPath, this.data, { spaces: 2 });
            console.log('💾 Saved persistence data:', this.data);
        }
        catch (error) {
            console.error('❌ Error saving persistence data:', error);
        }
    }
    async getCounter() {
        return this.data.counter;
    }
    async incrementCounter() {
        this.data.counter++;
        await this.saveData();
        return this.data.counter;
    }
    async getPersistenceInfo() {
        return {
            counter: this.data.counter,
            lastUpdated: this.data.lastUpdated,
            dataPath: this.dataPath
        };
    }
}
// Simple mock services
class SimpleTelemetry {
    recordRequest(data) {
        console.log('📊 Request:', data);
    }
    recordError(data) {
        console.log('❌ Error:', data);
    }
    getMetrics() {
        return {
            requests: 0,
            errors: 0,
            timestamp: new Date().toISOString()
        };
    }
}
class SimpleROMRegistry {
    async searchROMs(query) {
        console.log('🔍 Searching ROMs for:', query);
        return [
            {
                id: 'mock-api',
                name: 'Mock API Service',
                capabilities: ['api-cluster']
            }
        ];
    }
    async getRegistryStats() {
        return {
            totalROMs: 1,
            totalDeployments: 1
        };
    }
}
// Create the server
const app = (0, express_1.default)();
const telemetry = new SimpleTelemetry();
const romRegistry = new SimpleROMRegistry();
const persistence = new SimplePersistence();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../dist')));
// Request logging
app.use((req, res, next) => {
    telemetry.recordRequest({
        method: req.method,
        path: req.path,
        timestamp: new Date()
    });
    next();
});
// Health endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: 'local',
        roms: 1,
        backends: 1
    });
});
// Metrics endpoint
app.get('/metrics', (req, res) => {
    res.json(telemetry.getMetrics());
});
// Registry health endpoint
app.get('/registry/health', async (req, res) => {
    try {
        const stats = await romRegistry.getRegistryStats();
        res.json({
            status: 'healthy',
            registry: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: 'Registry unavailable',
            timestamp: new Date().toISOString()
        });
    }
});
// Persistence endpoints
app.get('/persistence/counter', async (req, res) => {
    try {
        const counter = await persistence.getCounter();
        const info = await persistence.getPersistenceInfo();
        res.json({
            success: true,
            counter,
            info,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get counter',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
app.post('/persistence/counter/increment', async (req, res) => {
    try {
        const newCounter = await persistence.incrementCounter();
        const info = await persistence.getPersistenceInfo();
        res.json({
            success: true,
            counter: newCounter,
            message: 'Counter incremented successfully',
            info,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to increment counter',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
app.get('/persistence/info', async (req, res) => {
    try {
        const info = await persistence.getPersistenceInfo();
        res.json({
            success: true,
            info,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get persistence info',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
// API routing - demonstrate intelligent routing
app.use('/api/*', async (req, res, next) => {
    try {
        console.log('🔄 Routing API request:', req.path);
        // Simulate ROM discovery
        const roms = await romRegistry.searchROMs('api-cluster');
        if (roms.length === 0) {
            return res.status(503).json({
                error: 'No backend available',
                message: 'All API backends are unavailable',
                timestamp: new Date().toISOString()
            });
        }
        // Simulate backend selection (in real implementation, this would be intelligent)
        const selectedBackend = roms[0];
        if (selectedBackend) {
            console.log('🎯 Selected backend:', selectedBackend.name);
            // Simulate backend response
            res.json({
                success: true,
                message: 'API request routed successfully',
                backend: selectedBackend.name,
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(503).json({
                error: 'No backend available',
                message: 'Backend selection failed',
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        telemetry.recordError({
            type: 'routing_error',
            path: req.path,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            error: 'Routing failed',
            message: 'Failed to route API request',
            timestamp: new Date().toISOString()
        });
    }
});
// File service routing
app.use('/files/*', async (req, res) => {
    try {
        console.log('📁 Routing file request:', req.path);
        // Simulate file service backend
        res.json({
            success: true,
            message: 'File request routed successfully',
            service: 'file-service',
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'File service error',
            message: 'Failed to route file request',
            timestamp: new Date().toISOString()
        });
    }
});
// Static file serving - this is the ROM pattern
app.use('/*', async (req, res) => {
    try {
        const filePath = path_1.default.join(__dirname, '../dist', req.path);
        // Check if file exists
        if (await fs_extra_1.default.pathExists(filePath)) {
            const stats = await fs_extra_1.default.stat(filePath);
            if (stats.isFile()) {
                return res.sendFile(filePath);
            }
        }
        // Serve index.html for SPA routing
        const indexPath = path_1.default.join(__dirname, '../dist/index.html');
        if (await fs_extra_1.default.pathExists(indexPath)) {
            return res.sendFile(indexPath);
        }
        // No file found
        res.status(404).json({
            error: 'Not found',
            path: req.path,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to serve static file',
            timestamp: new Date().toISOString()
        });
    }
});
// Error handling
app.use((error, req, res, next) => {
    telemetry.recordError({
        type: 'server_error',
        message: error.message,
        path: req.path,
        method: req.method
    });
    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});
// Start the server
const PORT = parseInt(process.env['PORT'] || '3000', 10);
const HOST = process.env['HOST'] || 'localhost';
app.listen(PORT, HOST, () => {
    console.log('🚀 WAN OS Serve Pattern Example Server Started!');
    console.log('📁 Configuration: Frontend ROM with Intelligent Routing');
    console.log('🌍 Environment: local');
    console.log('🔧 Mode: distributed (mock)');
    console.log(`🌐 Server running on http://${HOST}:${PORT}`);
    console.log('\n✅ Available endpoints:');
    console.log(`   📊 Health: http://${HOST}:${PORT}/health`);
    console.log(`   📈 Metrics: http://${HOST}:${PORT}/metrics`);
    console.log(`   🔍 Registry: http://${HOST}:${PORT}/registry/health`);
    console.log(`   💾 Persistence: http://${HOST}:${PORT}/persistence/counter`);
    console.log(`   🔢 Counter Increment: http://${HOST}:${PORT}/persistence/counter/increment (POST)`);
    console.log(`   📁 Persistence Info: http://${HOST}:${PORT}/persistence/info`);
    console.log(`   🌐 Frontend: http://${HOST}:${PORT}/`);
    console.log(`   🔄 API Test: http://${HOST}:${PORT}/api/test`);
    console.log(`   📁 File Test: http://${HOST}:${PORT}/files/test`);
    console.log('\n🎯 This demonstrates:');
    console.log('   - Static Frontend ROM serving');
    console.log('   - Intelligent API routing');
    console.log('   - ROM registry discovery');
    console.log('   - Health monitoring');
    console.log('   - Telemetry collection');
    console.log('   - Simple persistence system');
});
// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

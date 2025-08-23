"use strict";
/**
 * Mock ROM Registry for WAN OS Serve Server
 * Used for testing and development
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockROMRegistry = void 0;
class MockROMRegistry {
    constructor() {
        this.roms = new Map();
        this.deployments = new Map();
        this.initializeMockROMs();
    }
    /**
     * Initialize mock ROMs for testing
     */
    initializeMockROMs() {
        // Mock API ROMs
        this.roms.set('api-cluster-1', {
            id: 'api-cluster-1',
            name: 'API Cluster',
            type: 'backend',
            capabilities: ['api-cluster', 'user-management', 'authentication'],
            version: '1.0.0',
            environment: 'local'
        });
        this.roms.set('file-service-1', {
            id: 'file-service-1',
            name: 'File Service',
            type: 'backend',
            capabilities: ['file-service', 'storage', 'file-management'],
            version: '1.0.0',
            environment: 'local'
        });
        this.roms.set('monitoring-service-1', {
            id: 'monitoring-service-1',
            name: 'Monitoring Service',
            type: 'backend',
            capabilities: ['monitoring', 'health-checks', 'metrics'],
            version: '1.0.0',
            environment: 'local'
        });
        // Mock deployments
        this.deployments.set('api-cluster-1', [
            {
                id: 'deployment-1',
                url: 'http://localhost:8081',
                type: 'mock',
                region: 'us-east-1',
                zone: 'local'
            }
        ]);
        this.deployments.set('file-service-1', [
            {
                id: 'deployment-1',
                url: 'http://localhost:8082',
                type: 'mock',
                region: 'us-east-1',
                zone: 'local'
            }
        ]);
        this.deployments.set('monitoring-service-1', [
            {
                id: 'deployment-1',
                url: 'http://localhost:8083',
                type: 'mock',
                region: 'us-east-1',
                zone: 'local'
            }
        ]);
    }
    /**
     * Search for ROMs
     */
    async searchROMs(query, options = {}) {
        const results = [];
        for (const rom of this.roms.values()) {
            // Check if ROM matches the query
            if (rom.name.toLowerCase().includes(query.toLowerCase()) ||
                rom.id.toLowerCase().includes(query.toLowerCase())) {
                // Check type filter
                if (options.type && rom.type !== options.type) {
                    continue;
                }
                // Check environment filter
                if (options.environment && rom.environment !== options.environment) {
                    continue;
                }
                // Check capabilities filter
                if (options.capabilities) {
                    const hasAllCapabilities = options.capabilities.every(cap => rom.capabilities.includes(cap));
                    if (!hasAllCapabilities) {
                        continue;
                    }
                }
                results.push(rom);
            }
        }
        return results;
    }
    /**
     * Get ROM information
     */
    async getROMInfo(romId) {
        const rom = this.roms.get(romId);
        if (!rom) {
            throw new Error(`ROM not found: ${romId}`);
        }
        return rom;
    }
    /**
     * Get ROM deployments
     */
    async getROMDeployments(romId) {
        return this.deployments.get(romId) || [];
    }
    /**
     * Get registry statistics
     */
    async getRegistryStats() {
        const romsByType = {};
        const romsByEnvironment = {};
        for (const rom of this.roms.values()) {
            romsByType[rom.type] = (romsByType[rom.type] || 0) + 1;
            romsByEnvironment[rom.environment] = (romsByEnvironment[rom.environment] || 0) + 1;
        }
        let totalDeployments = 0;
        for (const deployments of this.deployments.values()) {
            totalDeployments += deployments.length;
        }
        return {
            totalROMs: this.roms.size,
            totalDeployments,
            romsByType,
            romsByEnvironment
        };
    }
    /**
     * Add a mock ROM
     */
    addMockROM(rom) {
        this.roms.set(rom.id, rom);
    }
    /**
     * Add mock deployments for a ROM
     */
    addMockDeployments(romId, deployments) {
        this.deployments.set(romId, deployments);
    }
    /**
     * Clear all mock data
     */
    clear() {
        this.roms.clear();
        this.deployments.clear();
        this.initializeMockROMs();
    }
}
exports.MockROMRegistry = MockROMRegistry;
//# sourceMappingURL=MockROMRegistry.js.map
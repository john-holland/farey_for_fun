/**
 * WAN OS ROM Registry
 * Package management system for WAN OS ROMs supporting npm and Haxe
 */

export * from './types';
export * from './registry';
export * from './rom-manager';
export * from './validators';
export * from './installers';
export * from './utils';

import { ROMRegistry } from './registry';
import { ROMManager } from './rom-manager';
import { ROMValidator } from './validators';
import { ROMInstaller } from './installers';
import { RegistryConfig } from './types';

/**
 * Main WAN OS ROM Registry class
 * Provides unified interface for managing ROMs across different package managers
 */
export class WANOSROMRegistry {
  private registry: ROMRegistry;
  private manager: ROMManager;
  private validator: ROMValidator;
  private installer: ROMInstaller;
  private config: RegistryConfig;

  constructor(config?: Partial<RegistryConfig>) {
    this.config = {
      npmRegistry: 'https://registry.npmjs.org/',
      haxeRegistry: 'https://lib.haxe.org/',
      wanosRegistry: 'https://registry.wanos.cloud/',
      romPrefix: '@wanos-rom/',
      defaultEnvironment: 'local',
      ...config
    };

    this.registry = new ROMRegistry(this.config);
    this.manager = new ROMManager(this.config);
    this.validator = new ROMValidator(this.config);
    this.installer = new ROMInstaller(this.config);
  }

  /**
   * Register a new ROM in the registry
   */
  async registerROM(romPath: string, options?: {
    environment?: string;
    validate?: boolean;
    publish?: boolean;
  }): Promise<string> {
    try {
      // Validate ROM
      if (options?.validate !== false) {
        const validation = await this.validator.validateROM(romPath);
        if (!validation.isValid) {
          throw new Error(`ROM validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Register ROM
      const romId = await this.registry.registerROM(romPath, options?.environment);
      
      // Publish if requested
      if (options?.publish) {
        await this.publishROM(romId);
      }

      return romId;
    } catch (error) {
      throw new Error(`Failed to register ROM: ${error.message}`);
    }
  }

  /**
   * Install a ROM from the registry
   */
  async installROM(romId: string, options?: {
    environment?: string;
    version?: string;
    force?: boolean;
  }): Promise<void> {
    try {
      // Get ROM metadata
      const metadata = await this.registry.getROMMetadata(romId);
      
      // Validate compatibility
      const compatibility = await this.validator.validateCompatibility(metadata, options?.environment);
      if (!compatibility.isCompatible && !options?.force) {
        throw new Error(`ROM not compatible with current environment: ${compatibility.reasons.join(', ')}`);
      }

      // Install ROM
      await this.installer.installROM(romId, metadata, options);
      
      // Update local registry
      await this.manager.addROM(romId, metadata);
      
    } catch (error) {
      throw new Error(`Failed to install ROM: ${error.message}`);
    }
  }

  /**
   * List available ROMs
   */
  async listROMs(options?: {
    environment?: string;
    type?: string;
    search?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    version: string;
    type: string;
    description: string;
    environments: string[];
  }>> {
    try {
      return await this.registry.listROMs(options);
    } catch (error) {
      throw new Error(`Failed to list ROMs: ${error.message}`);
    }
  }

  /**
   * Get ROM information
   */
  async getROMInfo(romId: string): Promise<{
    id: string;
    name: string;
    version: string;
    type: string;
    description: string;
    author: string;
    license: string;
    environments: string[];
    capabilities: string[];
    dependencies: string[];
    size: number;
    checksum: string;
    publishedAt: Date;
  }> {
    try {
      return await this.registry.getROMInfo(romId);
    } catch (error) {
      throw new Error(`Failed to get ROM info: ${error.message}`);
    }
  }

  /**
   * Update an installed ROM
   */
  async updateROM(romId: string, options?: {
    version?: string;
    force?: boolean;
  }): Promise<void> {
    try {
      // Check if ROM is installed
      const isInstalled = await this.manager.isROMInstalled(romId);
      if (!isInstalled) {
        throw new Error(`ROM ${romId} is not installed`);
      }

      // Get update info
      const updateInfo = await this.registry.getUpdateInfo(romId, options?.version);
      
      // Validate update
      const validation = await this.validator.validateUpdate(romId, updateInfo);
      if (!validation.isValid && !options?.force) {
        throw new Error(`Update validation failed: ${validation.errors.join(', ')}`);
      }

      // Perform update
      await this.installer.updateROM(romId, updateInfo);
      
      // Update local registry
      await this.manager.updateROM(romId, updateInfo);
      
    } catch (error) {
      throw new Error(`Failed to update ROM: ${error.message}`);
    }
  }

  /**
   * Remove an installed ROM
   */
  async removeROM(romId: string, options?: {
    force?: boolean;
    keepData?: boolean;
  }): Promise<void> {
    try {
      // Check if ROM is installed
      const isInstalled = await this.manager.isROMInstalled(romId);
      if (!isInstalled) {
        throw new Error(`ROM ${romId} is not installed`);
      }

      // Check dependencies
      const dependencies = await this.manager.getROMDependencies(romId);
      if (dependencies.length > 0 && !options?.force) {
        throw new Error(`Cannot remove ROM with dependencies: ${dependencies.join(', ')}`);
      }

      // Remove ROM
      await this.installer.removeROM(romId, options);
      
      // Update local registry
      await this.manager.removeROM(romId);
      
    } catch (error) {
      throw new Error(`Failed to remove ROM: ${error.message}`);
    }
  }

  /**
   * Publish a ROM to the registry
   */
  async publishROM(romId: string): Promise<void> {
    try {
      await this.registry.publishROM(romId);
    } catch (error) {
      throw new Error(`Failed to publish ROM: ${error.message}`);
    }
  }

  /**
   * Search ROMs in the registry
   */
  async searchROMs(query: string, options?: {
    environment?: string;
    type?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    version: string;
    type: string;
    description: string;
    score: number;
  }>> {
    try {
      return await this.registry.searchROMs(query, options);
    } catch (error) {
      throw new Error(`Failed to search ROMs: ${error.message}`);
    }
  }

  /**
   * Get ROM dependencies
   */
  async getROMDependencies(romId: string): Promise<Array<{
    id: string;
    name: string;
    version: string;
    type: 'required' | 'optional' | 'peer';
  }>> {
    try {
      return await this.manager.getROMDependencies(romId);
    } catch (error) {
      throw new Error(`Failed to get ROM dependencies: ${error.message}`);
    }
  }

  /**
   * Check ROM health
   */
  async checkROMHealth(romId: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'passed' | 'failed' | 'warning';
      message?: string;
    }>;
    lastChecked: Date;
  }> {
    try {
      return await this.manager.checkROMHealth(romId);
    } catch (error) {
      throw new Error(`Failed to check ROM health: ${error.message}`);
    }
  }

  /**
   * Sync with remote registry
   */
  async syncRegistry(): Promise<{
    added: number;
    updated: number;
    removed: number;
    errors: string[];
  }> {
    try {
      return await this.registry.sync();
    } catch (error) {
      throw new Error(`Failed to sync registry: ${error.message}`);
    }
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<{
    totalROMs: number;
    totalEnvironments: number;
    totalTypes: number;
    lastSync: Date;
    registrySize: number;
  }> {
    try {
      return await this.registry.getStats();
    } catch (error) {
      throw new Error(`Failed to get registry stats: ${error.message}`);
    }
  }

  /**
   * Export ROM configuration
   */
  async exportROMConfig(romId: string, format: 'json' | 'yaml' | 'toml' = 'json'): Promise<string> {
    try {
      const config = await this.manager.getROMConfig(romId);
      
      switch (format) {
        case 'json':
          return JSON.stringify(config, null, 2);
        case 'yaml':
          const yaml = await import('yaml');
          return yaml.stringify(config);
        case 'toml':
          const toml = await import('@iarna/toml');
          return toml.stringify(config);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Failed to export ROM config: ${error.message}`);
    }
  }

  /**
   * Import ROM configuration
   */
  async importROMConfig(configData: string, format: 'json' | 'yaml' | 'toml' = 'json'): Promise<string> {
    try {
      let config: any;
      
      switch (format) {
        case 'json':
          config = JSON.parse(configData);
          break;
        case 'yaml':
          const yaml = await import('yaml');
          config = yaml.parse(configData);
          break;
        case 'toml':
          const toml = await import('@iarna/toml');
          config = toml.parse(configData);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Validate configuration
      const validation = await this.validator.validateConfig(config);
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Import configuration
      const romId = await this.manager.importROMConfig(config);
      return romId;
      
    } catch (error) {
      throw new Error(`Failed to import ROM config: ${error.message}`);
    }
  }

  /**
   * Get registry configuration
   */
  getConfig(): RegistryConfig {
    return { ...this.config };
  }

  /**
   * Update registry configuration
   */
  updateConfig(newConfig: Partial<RegistryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize components with new config
    this.registry = new ROMRegistry(this.config);
    this.manager = new ROMManager(this.config);
    this.validator = new ROMValidator(this.config);
    this.installer = new ROMInstaller(this.config);
  }
}

// Export default instance
export default WANOSROMRegistry;

// Export convenience functions
export const registerROM = (romPath: string, options?: any) => {
  const registry = new WANOSROMRegistry();
  return registry.registerROM(romPath, options);
};

export const installROM = (romId: string, options?: any) => {
  const registry = new WANOSROMRegistry();
  return registry.installROM(romId, options);
};

export const listROMs = (options?: any) => {
  const registry = new WANOSROMRegistry();
  return registry.listROMs(options);
};

export const searchROMs = (query: string, options?: any) => {
  const registry = new WANOSROMRegistry();
  return registry.searchROMs(query, options);
};

/**
 * Mock ROM Registry for WAN OS Serve Server
 * Used for testing and development
 */
export interface ROMInfo {
    id: string;
    name: string;
    type: string;
    capabilities: string[];
    version: string;
    environment: string;
}
export interface ROMSearchOptions {
    type?: string;
    environment?: string;
    capabilities?: string[];
}
export declare class MockROMRegistry {
    private roms;
    private deployments;
    constructor();
    /**
     * Initialize mock ROMs for testing
     */
    private initializeMockROMs;
    /**
     * Search for ROMs
     */
    searchROMs(query: string, options?: ROMSearchOptions): Promise<ROMInfo[]>;
    /**
     * Get ROM information
     */
    getROMInfo(romId: string): Promise<ROMInfo>;
    /**
     * Get ROM deployments
     */
    getROMDeployments(romId: string): Promise<any[]>;
    /**
     * Get registry statistics
     */
    getRegistryStats(): Promise<{
        totalROMs: number;
        totalDeployments: number;
        romsByType: Record<string, number>;
        romsByEnvironment: Record<string, number>;
    }>;
    /**
     * Add a mock ROM
     */
    addMockROM(rom: ROMInfo): void;
    /**
     * Add mock deployments for a ROM
     */
    addMockDeployments(romId: string, deployments: any[]): void;
    /**
     * Clear all mock data
     */
    clear(): void;
}
//# sourceMappingURL=MockROMRegistry.d.ts.map
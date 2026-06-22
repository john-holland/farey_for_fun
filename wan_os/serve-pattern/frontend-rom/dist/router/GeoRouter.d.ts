/**
 * WAN OS Geo Router
 * Handles geographic routing based on client location and backend regions
 */
import { BackendInstance } from './IntelligentRouter';
export interface GeoLocation {
    region: string;
    country?: string;
    city?: string;
    coordinates?: {
        lat: number;
        lon: number;
    };
}
export declare class GeoRouter {
    private regionMapping;
    private latencyMatrix;
    constructor();
    /**
     * Initialize region mapping for geographic routing
     */
    private initializeRegionMapping;
    /**
     * Route backends by geographic region
     */
    routeByRegion(backends: BackendInstance[], clientRegion: string): BackendInstance[];
    /**
     * Route backends by latency to client region
     */
    routeByLatency(backends: BackendInstance[], clientRegion: string): BackendInstance[];
    /**
     * Get optimal backend based on geographic proximity
     */
    getOptimalBackend(backends: BackendInstance[], clientLocation: GeoLocation): BackendInstance | null;
    /**
     * Get the healthiest backend from a list
     */
    private getHealthiestBackend;
    /**
     * Update latency matrix for a region
     */
    updateLatencyMatrix(region: string, latencies: Record<string, number>): void;
    /**
     * Get latency between two regions
     */
    getLatency(fromRegion: string, toRegion: string): number | null;
    /**
     * Get all regions
     */
    getRegions(): string[];
    /**
     * Get preferred regions for a client region
     */
    getPreferredRegions(clientRegion: string): string[];
    /**
     * Add custom region mapping
     */
    addRegionMapping(clientRegion: string, preferredRegions: string[]): void;
    /**
     * Get routing statistics
     */
    getStats(): {
        totalRegions: number;
        totalLatencyEntries: number;
        regionMappings: Record<string, string[]>;
    };
}
//# sourceMappingURL=GeoRouter.d.ts.map
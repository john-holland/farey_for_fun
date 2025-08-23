/**
 * WAN OS Static Asset Manager
 * Handles serving static frontend files (ROM pattern)
 */
import { FrontendConfig } from '../types/ServeConfig';
export declare class StaticAssetManager {
    private config;
    private sourcePath;
    constructor(config: FrontendConfig);
    /**
     * Serve a static file if it exists
     */
    serveFile(requestPath: string): Promise<string | null>;
    /**
     * Normalize the request path
     */
    private normalizePath;
    /**
     * Check if a file is valid and accessible
     */
    private isValidFile;
    /**
     * Get file information
     */
    getFileInfo(filePath: string): Promise<{
        exists: boolean;
        size: number;
        mimeType: string;
        lastModified: Date;
    } | null>;
    /**
     * Get MIME type for a file
     */
    private getMimeType;
    /**
     * List available files in the source directory
     */
    listFiles(directory?: string): Promise<string[]>;
    /**
     * Get source directory path
     */
    getSourcePath(): string;
    /**
     * Update configuration
     */
    updateConfig(config: FrontendConfig): void;
}
//# sourceMappingURL=StaticAssetManager.d.ts.map
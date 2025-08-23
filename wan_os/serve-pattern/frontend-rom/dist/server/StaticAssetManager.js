"use strict";
/**
 * WAN OS Static Asset Manager
 * Handles serving static frontend files (ROM pattern)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticAssetManager = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
class StaticAssetManager {
    constructor(config) {
        this.config = config;
        this.sourcePath = path_1.default.resolve(config.source);
    }
    /**
     * Serve a static file if it exists
     */
    async serveFile(requestPath) {
        try {
            // Normalize the request path
            const normalizedPath = this.normalizePath(requestPath);
            // Try to find the file in the source directory
            const filePath = path_1.default.join(this.sourcePath, normalizedPath);
            // Check if file exists and is within the source directory
            if (await this.isValidFile(filePath)) {
                return filePath;
            }
            // Try with index.html for directory requests
            if (requestPath.endsWith('/') || requestPath === '') {
                const indexPath = path_1.default.join(this.sourcePath, 'index.html');
                if (await fs_extra_1.default.pathExists(indexPath)) {
                    return indexPath;
                }
            }
            // Try common file extensions
            const extensions = ['.html', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
            for (const ext of extensions) {
                const fileWithExt = filePath + ext;
                if (await this.isValidFile(fileWithExt)) {
                    return fileWithExt;
                }
            }
            return null;
        }
        catch (error) {
            console.error(`Error serving file ${requestPath}:`, error);
            return null;
        }
    }
    /**
     * Normalize the request path
     */
    normalizePath(requestPath) {
        // Remove leading slash
        let normalized = requestPath.startsWith('/') ? requestPath.slice(1) : requestPath;
        // Handle root path
        if (normalized === '') {
            normalized = 'index.html';
        }
        // Remove query parameters
        if (normalized.includes('?')) {
            normalized = normalized.split('?')[0] || '';
        }
        return normalized;
    }
    /**
     * Check if a file is valid and accessible
     */
    async isValidFile(filePath) {
        try {
            // Check if file exists
            if (!(await fs_extra_1.default.pathExists(filePath))) {
                return false;
            }
            // Check if it's a file (not a directory)
            const stats = await fs_extra_1.default.stat(filePath);
            if (!stats.isFile()) {
                return false;
            }
            // Check if the file is within the source directory
            const relativePath = path_1.default.relative(this.sourcePath, filePath);
            if (relativePath.startsWith('..') || path_1.default.isAbsolute(relativePath)) {
                return false;
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get file information
     */
    async getFileInfo(filePath) {
        try {
            if (!(await this.isValidFile(filePath))) {
                return null;
            }
            const stats = await fs_extra_1.default.stat(filePath);
            const mimeType = this.getMimeType(filePath);
            return {
                exists: true,
                size: stats.size,
                mimeType,
                lastModified: stats.mtime
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Get MIME type for a file
     */
    getMimeType(filePath) {
        const ext = path_1.default.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.htm': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
    /**
     * List available files in the source directory
     */
    async listFiles(directory = '') {
        try {
            const dirPath = path_1.default.join(this.sourcePath, directory);
            if (!(await fs_extra_1.default.pathExists(dirPath))) {
                return [];
            }
            const items = await fs_extra_1.default.readdir(dirPath);
            const files = [];
            for (const item of items) {
                const itemPath = path_1.default.join(dirPath, item);
                const stats = await fs_extra_1.default.stat(itemPath);
                const relativePath = path_1.default.join(directory, item);
                if (stats.isFile()) {
                    files.push(relativePath);
                }
                else if (stats.isDirectory()) {
                    // Recursively list files in subdirectories
                    const subFiles = await this.listFiles(relativePath);
                    files.push(...subFiles);
                }
            }
            return files;
        }
        catch (error) {
            console.error(`Error listing files in ${directory}:`, error);
            return [];
        }
    }
    /**
     * Get source directory path
     */
    getSourcePath() {
        return this.sourcePath;
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = config;
        this.sourcePath = path_1.default.resolve(config.source);
    }
}
exports.StaticAssetManager = StaticAssetManager;
//# sourceMappingURL=StaticAssetManager.js.map
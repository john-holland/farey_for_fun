/**
 * WAN OS Static Asset Manager
 * Handles serving static frontend files (ROM pattern)
 */

import path from 'path';
import fs from 'fs-extra';
import { FrontendConfig } from '../types/ServeConfig';

export class StaticAssetManager {
  private config: FrontendConfig;
  private sourcePath: string;

  constructor(config: FrontendConfig) {
    this.config = config;
    this.sourcePath = path.resolve(config.source);
  }

  /**
   * Serve a static file if it exists
   */
  async serveFile(requestPath: string): Promise<string | null> {
    try {
      // Normalize the request path
      const normalizedPath = this.normalizePath(requestPath);
      
      // Try to find the file in the source directory
      const filePath = path.join(this.sourcePath, normalizedPath);
      
      // Check if file exists and is within the source directory
      if (await this.isValidFile(filePath)) {
        return filePath;
      }

      // Try with index.html for directory requests
      if (requestPath.endsWith('/') || requestPath === '') {
        const indexPath = path.join(this.sourcePath, 'index.html');
        if (await fs.pathExists(indexPath)) {
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
    } catch (error) {
      console.error(`Error serving file ${requestPath}:`, error);
      return null;
    }
  }

  /**
   * Normalize the request path
   */
  private normalizePath(requestPath: string): string {
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
  private async isValidFile(filePath: string): Promise<boolean> {
    try {
      // Check if file exists
      if (!(await fs.pathExists(filePath))) {
        return false;
      }

      // Check if it's a file (not a directory)
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return false;
      }

      // Check if the file is within the source directory
      const relativePath = path.relative(this.sourcePath, filePath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size: number;
    mimeType: string;
    lastModified: Date;
  } | null> {
    try {
      if (!(await this.isValidFile(filePath))) {
        return null;
      }

      const stats = await fs.stat(filePath);
      const mimeType = this.getMimeType(filePath);

      return {
        exists: true,
        size: stats.size,
        mimeType,
        lastModified: stats.mtime
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get MIME type for a file
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
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
  async listFiles(directory: string = ''): Promise<string[]> {
    try {
      const dirPath = path.join(this.sourcePath, directory);
      
      if (!(await fs.pathExists(dirPath))) {
        return [];
      }

      const items = await fs.readdir(dirPath);
      const files: string[] = [];

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        const relativePath = path.join(directory, item);

        if (stats.isFile()) {
          files.push(relativePath);
        } else if (stats.isDirectory()) {
          // Recursively list files in subdirectories
          const subFiles = await this.listFiles(relativePath);
          files.push(...subFiles);
        }
      }

      return files;
    } catch (error) {
      console.error(`Error listing files in ${directory}:`, error);
      return [];
    }
  }

  /**
   * Get source directory path
   */
  getSourcePath(): string {
    return this.sourcePath;
  }

  /**
   * Update configuration
   */
  updateConfig(config: FrontendConfig): void {
    this.config = config;
    this.sourcePath = path.resolve(config.source);
  }
}

/**
 * WAN OS Middleware Manager
 * Handles custom middleware configuration and application
 */

import { Application } from 'express';
import { MiddlewareConfig } from '../types/ServeConfig';

export class MiddlewareManager {
  private middleware: MiddlewareConfig[];

  constructor(middleware: MiddlewareConfig[]) {
    this.middleware = middleware;
  }

  /**
   * Apply all configured middleware to the Express app
   */
  applyMiddleware(app: Application): void {
    for (const middleware of this.middleware) {
      if (middleware.enabled) {
        this.applyMiddlewareByName(app, middleware);
      }
    }
  }

  /**
   * Apply specific middleware by name
   */
  private applyMiddlewareByName(app: Application, middleware: MiddlewareConfig): void {
    switch (middleware.name) {
      case 'cors':
        this.applyCorsMiddleware(app, middleware);
        break;
      case 'compression':
        this.applyCompressionMiddleware(app, middleware);
        break;
      case 'telemetry':
        this.applyTelemetryMiddleware(app, middleware);
        break;
      case 'security':
        this.applySecurityMiddleware(app, middleware);
        break;
      default:
        console.warn(`Unknown middleware: ${middleware.name}`);
    }
  }

  /**
   * Apply CORS middleware
   */
  private applyCorsMiddleware(app: Application, middleware: MiddlewareConfig): void {
    // CORS is handled by the main server setup
    console.log('CORS middleware configured');
  }

  /**
   * Apply compression middleware
   */
  private applyCompressionMiddleware(app: Application, middleware: MiddlewareConfig): void {
    // Compression is handled by the main server setup
    console.log('Compression middleware configured');
  }

  /**
   * Apply telemetry middleware
   */
  private applyTelemetryMiddleware(app: Application, middleware: MiddlewareConfig): void {
    // Telemetry is handled by the main server setup
    console.log('Telemetry middleware configured');
  }

  /**
   * Apply security middleware
   */
  private applySecurityMiddleware(app: Application, middleware: MiddlewareConfig): void {
    // Security headers are handled by helmet in the main server
    console.log('Security middleware configured');
  }

  /**
   * Get middleware configuration
   */
  getMiddleware(): MiddlewareConfig[] {
    return this.middleware;
  }

  /**
   * Update middleware configuration
   */
  updateMiddleware(middleware: MiddlewareConfig[]): void {
    this.middleware = middleware;
  }
}

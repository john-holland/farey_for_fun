/**
 * WAN OS Backend Proxy
 * Handles proxying requests to backend services
 */

import { Request, Response } from 'express';
import { BackendInstance } from '../router/IntelligentRouter';
import { MockTelemetryService as TelemetryService } from '../mocks/MockTelemetryService';

export class BackendProxy {
  private telemetry: TelemetryService;

  constructor(telemetry: TelemetryService) {
    this.telemetry = telemetry;
  }

  /**
   * Proxy a request to a backend service
   */
  async proxyRequest(req: Request, res: Response, backend: BackendInstance): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Prepare the request URL
      const targetUrl = this.buildTargetUrl(req, backend);
      
      // Prepare headers
      const headers = this.prepareHeaders(req, backend);
      
      // Prepare request body
      const body = this.prepareRequestBody(req);
      
      // Make the request to the backend
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        ...(body && { body }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      // Record successful proxy request
      this.telemetry.recordProxyRequest({
        method: req.method,
        path: req.path,
        backend: backend.id,
        responseTime,
        statusCode: response.status,
        timestamp: new Date()
      });

      // Forward response headers
      this.forwardResponseHeaders(response, res);
      
      // Forward response body
      await this.forwardResponseBody(response, res);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record failed proxy request
      this.telemetry.recordProxyError({
        method: req.method,
        path: req.path,
        backend: backend.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        timestamp: new Date()
      });

      // Send error response
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Failed to proxy request to backend',
        backend: backend.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Build the target URL for the backend
   */
  private buildTargetUrl(req: Request, backend: BackendInstance): string {
    const baseUrl = backend.url.endsWith('/') ? backend.url.slice(0, -1) : backend.url;
    const path = req.path.startsWith('/') ? req.path : `/${req.path}`;
    
    // Remove the /api prefix if it exists and the backend expects it
    const cleanPath = path.startsWith('/api') ? path.slice(4) : path;
    
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Prepare headers for the backend request
   */
  private prepareHeaders(req: Request, backend: BackendInstance): Record<string, string> {
    const headers: Record<string, string> = {};

    // Copy relevant headers from the original request
    const relevantHeaders = [
      'content-type',
      'authorization',
      'x-api-key',
      'x-request-id',
      'user-agent',
      'accept',
      'accept-language',
      'accept-encoding'
    ];

    for (const header of relevantHeaders) {
      const value = req.get(header);
      if (value) {
        headers[header] = value;
      }
    }

    // Add WAN OS specific headers
    headers['x-wanos-proxy'] = 'true';
    headers['x-wanos-backend'] = backend.id;
    headers['x-wanos-timestamp'] = new Date().toISOString();

    // Add client information
    if (req.ip) {
      headers['x-forwarded-for'] = req.ip;
    }

    return headers;
  }

  /**
   * Prepare request body
   */
  private prepareRequestBody(req: Request): string | Buffer | undefined {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return undefined;
    }

    // For JSON requests
    if (req.is('application/json')) {
      return JSON.stringify(req.body);
    }

    // For form data
    if (req.is('application/x-www-form-urlencoded')) {
      return req.body;
    }

    // For raw body
    if (req.body) {
      return req.body;
    }

    return undefined;
  }

  /**
   * Forward response headers from backend to client
   */
  private forwardResponseHeaders(backendResponse: globalThis.Response, clientResponse: Response): void {
    // Copy response headers
    for (const [key, value] of backendResponse.headers.entries()) {
      // Skip headers that shouldn't be forwarded
      if (this.shouldSkipHeader(key)) {
        continue;
      }
      
      clientResponse.set(key, value);
    }

    // Set WAN OS specific headers
    clientResponse.set('x-wanos-proxied', 'true');
    clientResponse.set('x-wanos-backend', 'true');
  }

  /**
   * Check if a header should be skipped when forwarding
   */
  private shouldSkipHeader(headerName: string): boolean {
    const skipHeaders = [
      'connection',
      'keep-alive',
      'transfer-encoding',
      'x-powered-by',
      'server'
    ];

    return skipHeaders.some(skip => 
      headerName.toLowerCase().includes(skip.toLowerCase())
    );
  }

  /**
   * Forward response body from backend to client
   */
  private async forwardResponseBody(backendResponse: globalThis.Response, clientResponse: Response): Promise<void> {
    // Set status code
    clientResponse.status(backendResponse.status as number);

    // Handle different content types
    const contentType = backendResponse.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const jsonData = await backendResponse.json();
      clientResponse.json(jsonData);
    } else if (contentType?.includes('text/')) {
      const textData = await backendResponse.text();
      clientResponse.send(textData);
    } else {
      // For binary data or other types, stream the response
      const buffer = await backendResponse.arrayBuffer();
      clientResponse.send(Buffer.from(buffer));
    }
  }

  /**
   * Stream response from backend to client (for large responses)
   */
  async streamResponse(req: Request, res: Response, backend: BackendInstance): Promise<void> {
    const startTime = Date.now();
    
    try {
      const targetUrl = this.buildTargetUrl(req, backend);
      const headers = this.prepareHeaders(req, backend);
      const body = this.prepareRequestBody(req);

      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        ...(body && { body }),
        signal: AbortSignal.timeout(30000)
      });

      const responseTime = Date.now() - startTime;
      
      // Record successful stream request
      this.telemetry.recordProxyStream({
        method: req.method,
        path: req.path,
        backend: backend.id,
        responseTime,
        statusCode: response.status,
        timestamp: new Date()
      });

      // Forward headers
      this.forwardResponseHeaders(response, res);
      
      // Set status
      res.status(response.status as number);

      // Stream the response
      if (response.body) {
        response.body.pipe(res);
      } else {
        res.end();
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record failed stream request
      this.telemetry.recordProxyStreamError({
        method: req.method,
        path: req.path,
        backend: backend.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        timestamp: new Date()
      });

      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Failed to stream response from backend',
        backend: backend.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Health check a backend
   */
  async healthCheck(backend: BackendInstance): Promise<{
    healthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${backend.url}/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'WAN-OS-Proxy/1.0.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          healthy: true,
          responseTime
        };
      } else {
        return {
          healthy: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * WAN OS Backend Proxy
 * Handles proxying requests to backend services
 */
import { Request, Response } from 'express';
import { BackendInstance } from '../router/IntelligentRouter';
import { MockTelemetryService as TelemetryService } from '../mocks/MockTelemetryService';
export declare class BackendProxy {
    private telemetry;
    constructor(telemetry: TelemetryService);
    /**
     * Proxy a request to a backend service
     */
    proxyRequest(req: Request, res: Response, backend: BackendInstance): Promise<void>;
    /**
     * Build the target URL for the backend
     */
    private buildTargetUrl;
    /**
     * Prepare headers for the backend request
     */
    private prepareHeaders;
    /**
     * Prepare request body
     */
    private prepareRequestBody;
    /**
     * Forward response headers from backend to client
     */
    private forwardResponseHeaders;
    /**
     * Check if a header should be skipped when forwarding
     */
    private shouldSkipHeader;
    /**
     * Forward response body from backend to client
     */
    private forwardResponseBody;
    /**
     * Stream response from backend to client (for large responses)
     */
    streamResponse(req: Request, res: Response, backend: BackendInstance): Promise<void>;
    /**
     * Health check a backend
     */
    healthCheck(backend: BackendInstance): Promise<{
        healthy: boolean;
        responseTime: number;
        error?: string;
    }>;
}
//# sourceMappingURL=BackendProxy.d.ts.map
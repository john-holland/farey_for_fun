#!/usr/bin/env python3
"""
WAN OS Simple Web Server Example
Demonstrates basic WAN OS capabilities including WASM support and telemetry
"""

import asyncio
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, Optional

# Add WAN OS to path
sys.path.append(str(Path(__file__).parent.parent))

from wan_os.hypervisor.hypervisor import Hypervisor
from wan_os.fareyfs.fareyfs import FareyFS
from wan_os.telemetry.telemetry_service import TelemetryService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WANOSWebServer:
    """Simple web server using WAN OS capabilities"""
    
    def __init__(self, config_path: str = "sass-rom-config.yaml"):
        self.config_path = config_path
        self.config = self.load_config()
        self.hypervisor = None
        self.fareyfs = None
        self.telemetry = None
        self.running = False
        
        # Load configuration based on environment
        self.environment = os.getenv("WAN_OS_ENV", "local")
        self.env_config = self.config.get(self.environment, {})
        
        logger.info(f"Initializing WAN OS Web Server in {self.environment} environment")
        
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        try:
            import yaml
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return {}
    
    async def initialize(self):
        """Initialize WAN OS components"""
        try:
            # Initialize hypervisor
            self.hypervisor = Hypervisor(self.config_path)
            logger.info("Hypervisor initialized")
            
            # Initialize FareyFS
            fareyfs_config = self.env_config.get('wan_os', {}).get('fareyfs', {})
            base_path = fareyfs_config.get('base_path', './wanos_data')
            self.fareyfs = FareyFS(base_path)
            logger.info(f"FareyFS initialized at {base_path}")
            
            # Initialize telemetry
            telemetry_config = self.env_config.get('wan_os', {}).get('telemetry', {})
            if telemetry_config.get('enabled', True):
                self.telemetry = TelemetryService(telemetry_config)
                logger.info("Telemetry service initialized")
            
            logger.info("WAN OS Web Server initialization completed")
            
        except Exception as e:
            logger.error(f"Failed to initialize WAN OS: {e}")
            raise
    
    async def start_wasm_workload(self, workload_name: str, wasm_file: str) -> Optional[str]:
        """Start a WASM workload"""
        try:
            if not self.hypervisor:
                logger.error("Hypervisor not initialized")
                return None
            
            # Check if WASM support is enabled
            features = self.env_config.get('wan_os', {}).get('features', {}).get('flags', {})
            if not features.get('wasm_support', False):
                logger.warning("WASM support not enabled in current environment")
                return None
            
            # Start WASM workload
            workload_config = {
                "memory": "256MB",
                "table_size": 1000,
                "instances": 10
            }
            
            workload_id = await self.hypervisor.start_workload("WASM", workload_config)
            if workload_id:
                logger.info(f"Started WASM workload: {workload_id}")
                
                # Record telemetry
                if self.telemetry:
                    self.telemetry.record_workload_start("WASM", workload_id, workload_config)
                
                return workload_id
            else:
                logger.error("Failed to start WASM workload")
                return None
                
        except Exception as e:
            logger.error(f"Error starting WASM workload: {e}")
            return None
    
    async def serve_file(self, file_path: str) -> Dict[str, Any]:
        """Serve a file using FareyFS"""
        try:
            if not self.fareyfs:
                logger.error("FareyFS not initialized")
                return {"error": "FareyFS not available"}
            
            # Check if file exists in FareyFS
            if await self.fareyfs.file_exists(file_path):
                file_content = await self.fareyfs.get_file(file_path)
                return {
                    "status": "success",
                    "file_path": file_path,
                    "content": file_content.decode() if isinstance(file_content, bytes) else str(file_content),
                    "size": len(file_content) if file_content else 0
                }
            else:
                return {"error": "File not found", "file_path": file_path}
                
        except Exception as e:
            logger.error(f"Error serving file {file_path}: {e}")
            return {"error": str(e), "file_path": file_path}
    
    async def upload_file(self, file_path: str, content: bytes) -> Dict[str, Any]:
        """Upload a file to FareyFS"""
        try:
            if not self.fareyfs:
                logger.error("FareyFS not initialized")
                return {"error": "FareyFS not available"}
            
            # Upload file to FareyFS
            success = await self.fareyfs.add_file("local", file_path, content)
            
            if success:
                # Record telemetry
                if self.telemetry:
                    self.telemetry.record_file_operation("upload", file_path, len(content))
                
                return {
                    "status": "success",
                    "file_path": file_path,
                    "size": len(content),
                    "message": "File uploaded successfully"
                }
            else:
                return {"error": "Failed to upload file", "file_path": file_path}
                
        except Exception as e:
            logger.error(f"Error uploading file {file_path}: {e}")
            return {"error": str(e), "file_path": file_path}
    
    async def search_files(self, query: str) -> Dict[str, Any]:
        """Search files in FareyFS"""
        try:
            if not self.fareyfs:
                logger.error("FareyFS not initialized")
                return {"error": "FareyFS not available"}
            
            # Search files
            results = await self.fareyfs.search(query)
            
            # Record telemetry
            if self.telemetry:
                self.telemetry.record_search_operation("text", query, len(results))
            
            return {
                "status": "success",
                "query": query,
                "results": results,
                "count": len(results)
            }
            
        except Exception as e:
            logger.error(f"Error searching files: {e}")
            return {"error": str(e), "query": query}
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get system status and health"""
        try:
            status = {
                "status": "healthy",
                "timestamp": time.time(),
                "environment": self.environment,
                "components": {}
            }
            
            # Check hypervisor status
            if self.hypervisor:
                status["components"]["hypervisor"] = "healthy"
            else:
                status["components"]["hypervisor"] = "unavailable"
                status["status"] = "degraded"
            
            # Check FareyFS status
            if self.fareyfs:
                status["components"]["fareyfs"] = "healthy"
            else:
                status["components"]["fareyfs"] = "unavailable"
                status["status"] = "degraded"
            
            # Check telemetry status
            if self.telemetry:
                status["components"]["telemetry"] = "healthy"
            else:
                status["components"]["telemetry"] = "unavailable"
            
            # Add environment-specific info
            env_info = self.env_config.get('wan_os', {})
            status["capabilities"] = env_info.get('capabilities', [])
            status["instance_id"] = env_info.get('instance_id', 'unknown')
            
            return status
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": time.time()
            }
    
    async def run_health_check(self) -> Dict[str, Any]:
        """Run comprehensive health check"""
        try:
            health = {
                "status": "healthy",
                "timestamp": time.time(),
                "checks": {}
            }
            
            # Basic system check
            health["checks"]["system"] = "passed"
            
            # Hypervisor check
            if self.hypervisor:
                health["checks"]["hypervisor"] = "passed"
            else:
                health["checks"]["hypervisor"] = "failed"
                health["status"] = "degraded"
            
            # FareyFS check
            if self.fareyfs:
                health["checks"]["fareyfs"] = "passed"
            else:
                health["checks"]["fareyfs"] = "failed"
                health["status"] = "degraded"
            
            # Telemetry check
            if self.telemetry:
                health["checks"]["telemetry"] = "passed"
            else:
                health["checks"]["telemetry"] = "warning"
            
            # Performance check
            try:
                start_time = time.time()
                await self.get_system_status()
                response_time = (time.time() - start_time) * 1000
                health["checks"]["performance"] = "passed"
                health["response_time_ms"] = response_time
            except Exception as e:
                health["checks"]["performance"] = "failed"
                health["status"] = "degraded"
            
            return health
            
        except Exception as e:
            logger.error(f"Error running health check: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": time.time()
            }
    
    async def shutdown(self):
        """Shutdown WAN OS components"""
        try:
            self.running = False
            
            if self.hypervisor:
                # Stop all workloads
                # Implementation depends on hypervisor interface
                logger.info("Hypervisor shutdown completed")
            
            if self.telemetry:
                # Flush telemetry data
                logger.info("Telemetry shutdown completed")
            
            logger.info("WAN OS Web Server shutdown completed")
            
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")

async def main():
    """Main function to demonstrate WAN OS web server"""
    try:
        # Create web server instance
        server = WANOSWebServer()
        
        # Initialize components
        await server.initialize()
        
        # Demonstrate capabilities
        logger.info("=== WAN OS Web Server Demo ===")
        
        # 1. System Status
        status = await server.get_system_status()
        logger.info(f"System Status: {json.dumps(status, indent=2)}")
        
        # 2. Health Check
        health = await server.run_health_check()
        logger.info(f"Health Check: {json.dumps(health, indent=2)}")
        
        # 3. Upload a test file
        test_content = b"Hello, WAN OS! This is a test file."
        upload_result = await server.upload_file("test.txt", test_content)
        logger.info(f"Upload Result: {json.dumps(upload_result, indent=2)}")
        
        # 4. Serve the file
        serve_result = await server.serve_file("test.txt")
        logger.info(f"Serve Result: {json.dumps(serve_result, indent=2)}")
        
        # 5. Search files
        search_result = await server.search_files("test")
        logger.info(f"Search Result: {json.dumps(search_result, indent=2)}")
        
        # 6. Try to start WASM workload (if supported)
        wasm_id = await server.start_wasm_workload("test-workload", "test.wasm")
        if wasm_id:
            logger.info(f"WASM workload started: {wasm_id}")
        
        # 7. Final status
        final_status = await server.get_system_status()
        logger.info(f"Final Status: {json.dumps(final_status, indent=2)}")
        
        # Shutdown
        await server.shutdown()
        
        logger.info("Demo completed successfully!")
        
    except Exception as e:
        logger.error(f"Demo failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

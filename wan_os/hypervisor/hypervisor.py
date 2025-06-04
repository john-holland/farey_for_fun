import asyncio
import docker
import yaml
import subprocess
import os
import signal
import logging
import wasmtime
from typing import Dict, List, Optional
from pathlib import Path

class WorkloadManager:
    def __init__(self, token_type: str):
        self.token_type = token_type
        self.workloads = {}
        self.child_processes = {}
        self.docker_client = docker.from_env()
        self.wasm_engine = wasmtime.Engine()
        
    async def allocate_resources(self, workload_id: str, resources: Dict) -> bool:
        """Allocate resources for a specific workload"""
        try:
            if self.token_type == "WASM":
                return await self._allocate_wasm_resources(workload_id, resources)
            else:
                return await self._allocate_container_resources(workload_id, resources)
        except Exception as e:
            logging.error(f"Error allocating resources: {e}")
            return False

    async def _allocate_wasm_resources(self, workload_id: str, resources: Dict) -> bool:
        """Allocate resources for a WASM workload"""
        try:
            # Create WASM store with resource limits
            store = wasmtime.Store(self.wasm_engine)
            store.limiter(
                memory_size=resources.get('memory', 1024 * 1024 * 1024),  # Default 1GB
                table_size=resources.get('table_size', 1000),
                instances=resources.get('instances', 100)
            )

            # Load and compile WASM module
            wasm_path = Path(__file__).parent / "wasm_modules" / f"{workload_id}.wasm"
            if not wasm_path.exists():
                logging.error(f"WASM module not found: {wasm_path}")
                return False

            module = wasmtime.Module.from_file(self.wasm_engine, str(wasm_path))
            instance = wasmtime.Instance(store, module, [])

            # Store workload info
            self.workloads[workload_id] = {
                "type": "WASM",
                "store": store,
                "instance": instance,
                "resources": resources
            }

            return True
        except Exception as e:
            logging.error(f"Error allocating WASM resources: {e}")
            return False

    async def _allocate_container_resources(self, workload_id: str, resources: Dict) -> bool:
        """Allocate resources for a container workload"""
        try:
            # Build the container if it doesn't exist
            image_name = f"farey-wan-{self.token_type.lower()}-worker"
            try:
                self.docker_client.images.get(image_name)
            except docker.errors.ImageNotFound:
                # Build from Dockerfile
                dockerfile_path = Path(__file__).parent / "Dockerfile"
                self.docker_client.images.build(
                    path=str(dockerfile_path.parent),
                    tag=image_name,
                    rm=True
                )

            # Start the container with SSH enabled
            container = self.docker_client.containers.run(
                image=image_name,
                detach=True,
                environment={
                    "WORKLOAD_ID": workload_id,
                    "TOKEN_TYPE": self.token_type,
                    "RESOURCES": str(resources)
                },
                ports={'22/tcp': None},  # Map SSH port dynamically
                volumes={
                    '/var/run/docker.sock': {'bind': '/var/run/docker.sock', 'mode': 'rw'}
                },
                privileged=True  # Required for Docker-in-Docker
            )
            
            # Get the mapped SSH port
            container.reload()
            ssh_port = container.ports['22/tcp'][0]['HostPort']
            
            # Store workload info
            self.workloads[workload_id] = {
                "type": "container",
                "container": container,
                "ssh_port": ssh_port,
                "resources": resources
            }
            
            return True
        except Exception as e:
            logging.error(f"Error allocating container resources: {e}")
            return False

    async def start_child_process_monitor(self, workload_id: str):
        """Start monitoring child processes for a workload"""
        if workload_id not in self.workloads:
            return

        container = self.workloads[workload_id]['container']
        
        # Start a process to monitor container logs
        process = await asyncio.create_subprocess_exec(
            'docker', 'logs', '-f', container.id,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        self.child_processes[workload_id] = process
        
        # Start monitoring task
        asyncio.create_task(self.monitor_child_process(workload_id, process))

    async def monitor_child_process(self, workload_id: str, process: asyncio.subprocess.Process):
        """Monitor a child process and handle its output"""
        try:
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                logging.info(f"Workload {workload_id}: {line.decode().strip()}")
        except Exception as e:
            logging.error(f"Error monitoring child process: {e}")
        finally:
            if workload_id in self.child_processes:
                del self.child_processes[workload_id]

    async def stop_workload(self, workload_id: str) -> bool:
        """Stop a running workload"""
        if workload_id in self.workloads:
            workload = self.workloads[workload_id]
            try:
                if workload["type"] == "WASM":
                    # Clean up WASM resources
                    workload["store"].cleanup()
                else:
                    # Stop container
                    workload["container"].stop()
                    workload["container"].remove()
                del self.workloads[workload_id]
                return True
            except Exception as e:
                logging.error(f"Error stopping workload: {e}")
                return False
        return False

    def get_workload_info(self, workload_id: str) -> Optional[Dict]:
        """Get information about a specific workload"""
        if workload_id in self.workloads:
            workload = self.workloads[workload_id]
            if workload["type"] == "WASM":
                return {
                    "type": "WASM",
                    "resources": workload["resources"],
                    "status": "running"
                }
            else:
                return {
                    "type": "container",
                    "ssh_command": f"ssh -p {workload['ssh_port']} root@localhost",
                    "status": workload["container"].status
                }
        return None

class Hypervisor:
    def __init__(self, config_path: str):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.gnt_manager = WorkloadManager("GNT")
        self.icp_manager = WorkloadManager("ICP")
        self.containers = {}
        
    async def start_workload(self, token_type: str, workload_config: Dict) -> Optional[str]:
        """Start a new workload based on token type"""
        manager = self.gnt_manager if token_type == "GNT" else self.icp_manager
        workload_id = f"{token_type}_{len(self.containers)}"
        
        success = await manager.allocate_resources(workload_id, workload_config)
        if success:
            workload_info = manager.get_workload_info(workload_id)
            self.containers[workload_id] = {
                "type": token_type,
                "config": workload_config,
                "status": "running",
                "ssh_info": workload_info
            }
            return workload_id
        return None
    
    async def stop_workload(self, workload_id: str) -> bool:
        """Stop a running workload"""
        if workload_id in self.containers:
            manager = self.gnt_manager if self.containers[workload_id]["type"] == "GNT" else self.icp_manager
            success = await manager.stop_workload(workload_id)
            if success:
                del self.containers[workload_id]
            return success
        return False
    
    def get_workload_status(self, workload_id: str) -> Optional[Dict]:
        """Get the status of a specific workload"""
        if workload_id in self.containers:
            return self.containers[workload_id]
        return None

async def main():
    hypervisor = Hypervisor("config.yaml")
    
    # Example workload
    workload_config = {
        "cpu_cores": 2,
        "memory": "4G",
        "storage": "20G"
    }
    
    # Start a GNT workload
    workload_id = await hypervisor.start_workload("GNT", workload_config)
    if workload_id:
        print(f"Started GNT workload: {workload_id}")
        
        # Get status and SSH info
        status = hypervisor.get_workload_status(workload_id)
        print(f"Workload status: {status}")
        
        if status and 'ssh_info' in status:
            print(f"SSH connection command: {status['ssh_info']['ssh_command']}")
        
        # Stop workload
        await hypervisor.stop_workload(workload_id)
        print(f"Stopped workload: {workload_id}")

if __name__ == "__main__":
    asyncio.run(main()) 
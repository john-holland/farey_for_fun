import asyncio
import docker
import yaml
import logging
from typing import Dict, List, Optional
from pathlib import Path

class ContainerManager:
    def __init__(self, config_path: str):
        self.config_path = config_path
        self.docker_client = docker.from_env()
        self.containers = {}
        
    async def list_containers(self) -> List[Dict]:
        """List all running containers with their SSH information"""
        containers = []
        for container in self.docker_client.containers.list():
            try:
                # Get SSH port mapping
                container.reload()
                ssh_port = container.ports.get('22/tcp', [{'HostPort': None}])[0]['HostPort']
                
                if ssh_port:
                    containers.append({
                        'id': container.id,
                        'name': container.name,
                        'status': container.status,
                        'ssh_port': ssh_port,
                        'ssh_command': f"ssh root@localhost -p {ssh_port}"
                    })
            except Exception as e:
                logging.error(f"Error getting container info: {e}")
        
        return containers
    
    async def get_container_info(self, container_id: str) -> Optional[Dict]:
        """Get detailed information about a specific container"""
        try:
            container = self.docker_client.containers.get(container_id)
            container.reload()
            
            ssh_port = container.ports.get('22/tcp', [{'HostPort': None}])[0]['HostPort']
            
            return {
                'id': container.id,
                'name': container.name,
                'status': container.status,
                'ssh_port': ssh_port,
                'ssh_command': f"ssh root@localhost -p {ssh_port}",
                'environment': container.attrs['Config']['Env'],
                'mounts': container.attrs['Mounts'],
                'networks': container.attrs['NetworkSettings']['Networks']
            }
        except Exception as e:
            logging.error(f"Error getting container info: {e}")
            return None
    
    async def execute_command(self, container_id: str, command: str) -> Optional[str]:
        """Execute a command in a container via SSH"""
        try:
            container = self.docker_client.containers.get(container_id)
            container.reload()
            
            ssh_port = container.ports.get('22/tcp', [{'HostPort': None}])[0]['HostPort']
            if not ssh_port:
                raise ValueError("Container does not have SSH port mapped")
            
            # Execute command via SSH
            process = await asyncio.create_subprocess_exec(
                'ssh', '-p', ssh_port, 'root@localhost', command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return stdout.decode()
            else:
                logging.error(f"Command failed: {stderr.decode()}")
                return None
                
        except Exception as e:
            logging.error(f"Error executing command: {e}")
            return None
    
    async def copy_file(self, container_id: str, local_path: str, remote_path: str) -> bool:
        """Copy a file to a container via SCP"""
        try:
            container = self.docker_client.containers.get(container_id)
            container.reload()
            
            ssh_port = container.ports.get('22/tcp', [{'HostPort': None}])[0]['HostPort']
            if not ssh_port:
                raise ValueError("Container does not have SSH port mapped")
            
            # Copy file via SCP
            process = await asyncio.create_subprocess_exec(
                'scp', '-P', ssh_port, local_path, f'root@localhost:{remote_path}',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return True
            else:
                logging.error(f"File copy failed: {stderr.decode()}")
                return False
                
        except Exception as e:
            logging.error(f"Error copying file: {e}")
            return False

async def main():
    # Example usage
    manager = ContainerManager("config.yaml")
    
    # List all containers
    containers = await manager.list_containers()
    print("Running containers:")
    for container in containers:
        print(f"Container: {container['name']}")
        print(f"SSH command: {container['ssh_command']}")
        print("---")
    
    if containers:
        # Get detailed info for first container
        container_info = await manager.get_container_info(containers[0]['id'])
        print(f"Detailed container info: {container_info}")
        
        # Execute a command
        result = await manager.execute_command(containers[0]['id'], 'ls -la')
        print(f"Command result: {result}")
        
        # Copy a file
        success = await manager.copy_file(containers[0]['id'], 'test.txt', '/root/test.txt')
        print(f"File copy success: {success}")

if __name__ == "__main__":
    asyncio.run(main()) 
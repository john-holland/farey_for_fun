import asyncio
import aiohttp
import yaml
import logging
from typing import Dict, List, Optional
from pathlib import Path

class RancherManager:
    def __init__(self, config_path: str):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.api_url = self.config['rancher']['api_url']
        self.api_key = self.config['rancher']['api_key']
        self.api_secret = self.config['rancher']['api_secret']
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            auth=aiohttp.BasicAuth(self.api_key, self.api_secret)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def create_cluster(self, name: str, config: Dict) -> Optional[Dict]:
        """Create a new Rancher cluster"""
        try:
            async with self.session.post(
                f"{self.api_url}/v3/clusters",
                json={
                    "name": name,
                    "type": "cluster",
                    "dockerRootDir": "/var/lib/docker",
                    "enableNetworkPolicy": True,
                    "enableClusterAlerting": True,
                    "enableClusterMonitoring": True,
                    "localClusterAuthEndpoint": {
                        "enabled": True
                    },
                    "rancherKubernetesEngineConfig": config
                }
            ) as response:
                if response.status == 201:
                    return await response.json()
                logging.error(f"Failed to create cluster: {await response.text()}")
                return None
        except Exception as e:
            logging.error(f"Error creating cluster: {e}")
            return None
    
    async def deploy_workload(self, cluster_id: str, workload_config: Dict) -> Optional[Dict]:
        """Deploy a workload to a Rancher cluster"""
        try:
            async with self.session.post(
                f"{self.api_url}/v3/project/{cluster_id}/workloads",
                json=workload_config
            ) as response:
                if response.status == 201:
                    return await response.json()
                logging.error(f"Failed to deploy workload: {await response.text()}")
                return None
        except Exception as e:
            logging.error(f"Error deploying workload: {e}")
            return None
    
    async def get_cluster_status(self, cluster_id: str) -> Optional[Dict]:
        """Get the status of a Rancher cluster"""
        try:
            async with self.session.get(
                f"{self.api_url}/v3/clusters/{cluster_id}"
            ) as response:
                if response.status == 200:
                    return await response.json()
                logging.error(f"Failed to get cluster status: {await response.text()}")
                return None
        except Exception as e:
            logging.error(f"Error getting cluster status: {e}")
            return None

async def main():
    # Example usage
    async with RancherManager("config.yaml") as rancher:
        # Create a new cluster
        cluster_config = {
            "network": {
                "plugin": "canal",
                "options": {
                    "flannel_backend_type": "vxlan"
                }
            },
            "services": {
                "etcd": {
                    "backup_config": {
                        "enabled": True,
                        "interval_hours": 12,
                        "retention": 6
                    }
                }
            }
        }
        
        cluster = await rancher.create_cluster("farey-cluster", cluster_config)
        if cluster:
            print(f"Created cluster: {cluster['id']}")
            
            # Deploy a workload
            workload_config = {
                "name": "farey-workload",
                "namespaceId": "default",
                "containers": [{
                    "name": "farey-container",
                    "image": "farey-wan-worker:latest",
                    "ports": [{
                        "containerPort": 22,
                        "hostPort": 0,
                        "protocol": "TCP"
                    }]
                }]
            }
            
            workload = await rancher.deploy_workload(cluster['id'], workload_config)
            if workload:
                print(f"Deployed workload: {workload['id']}")
            
            # Get cluster status
            status = await rancher.get_cluster_status(cluster['id'])
            print(f"Cluster status: {status}")

if __name__ == "__main__":
    asyncio.run(main()) 
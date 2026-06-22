import hashlib
import os
import json
from typing import Dict, Optional
import aiofiles
import asyncio
from pathlib import Path

class VolumeManager:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.volumes = {}
        self.ensure_base_directory()
    
    def ensure_base_directory(self):
        """Ensure the base directory exists"""
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def generate_volume_id(self, url: str, ip: str) -> str:
        """Generate a unique volume ID based on URL and IP"""
        combined = f"{url}:{ip}"
        return hashlib.sha256(combined.encode()).hexdigest()
    
    async def create_volume(self, url: str, ip: str) -> str:
        """Create a new volume for a URL-IP combination"""
        volume_id = self.generate_volume_id(url, ip)
        volume_path = self.base_path / volume_id
        
        if not volume_path.exists():
            volume_path.mkdir(parents=True)
            
            # Create volume metadata
            metadata = {
                "url": url,
                "ip": ip,
                "created_at": str(asyncio.get_event_loop().time()),
                "last_accessed": str(asyncio.get_event_loop().time())
            }
            
            async with aiofiles.open(volume_path / "metadata.json", "w") as f:
                await f.write(json.dumps(metadata, indent=2))
        
        self.volumes[volume_id] = {
            "path": str(volume_path),
            "url": url,
            "ip": ip
        }
        
        return volume_id
    
    async def get_volume(self, url: str, ip: str) -> Optional[str]:
        """Get existing volume ID for URL-IP combination"""
        volume_id = self.generate_volume_id(url, ip)
        if volume_id in self.volumes:
            # Update last accessed time
            volume_path = Path(self.volumes[volume_id]["path"])
            async with aiofiles.open(volume_path / "metadata.json", "r+") as f:
                metadata = json.loads(await f.read())
                metadata["last_accessed"] = str(asyncio.get_event_loop().time())
                await f.seek(0)
                await f.write(json.dumps(metadata, indent=2))
                await f.truncate()
            return volume_id
        return None
    
    async def write_to_volume(self, volume_id: str, path: str, data: bytes):
        """Write data to a specific path in the volume"""
        if volume_id not in self.volumes:
            raise ValueError(f"Volume {volume_id} does not exist")
        
        volume_path = Path(self.volumes[volume_id]["path"])
        file_path = volume_path / path.lstrip("/")
        
        # Ensure parent directories exist
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(data)
    
    async def read_from_volume(self, volume_id: str, path: str) -> Optional[bytes]:
        """Read data from a specific path in the volume"""
        if volume_id not in self.volumes:
            raise ValueError(f"Volume {volume_id} does not exist")
        
        volume_path = Path(self.volumes[volume_id]["path"])
        file_path = volume_path / path.lstrip("/")
        
        if not file_path.exists():
            return None
        
        async with aiofiles.open(file_path, "rb") as f:
            return await f.read()
    
    async def list_volume_contents(self, volume_id: str, path: str = "/") -> Dict:
        """List contents of a directory in the volume"""
        if volume_id not in self.volumes:
            raise ValueError(f"Volume {volume_id} does not exist")
        
        volume_path = Path(self.volumes[volume_id]["path"])
        dir_path = volume_path / path.lstrip("/")
        
        if not dir_path.exists() or not dir_path.is_dir():
            return {"error": "Directory does not exist"}
        
        contents = []
        for item in dir_path.iterdir():
            contents.append({
                "name": item.name,
                "type": "directory" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else None
            })
        
        return {"contents": contents}

async def main():
    # Example usage
    volume_manager = VolumeManager("./volumes")
    
    # Create a new volume
    url = "https://example.com"
    ip = "192.168.1.1"
    
    volume_id = await volume_manager.create_volume(url, ip)
    print(f"Created volume: {volume_id}")
    
    # Write some data
    await volume_manager.write_to_volume(volume_id, "/test.txt", b"Hello, WAN OS!")
    
    # Read the data back
    data = await volume_manager.read_from_volume(volume_id, "/test.txt")
    print(f"Read data: {data.decode()}")
    
    # List contents
    contents = await volume_manager.list_volume_contents(volume_id)
    print(f"Volume contents: {contents}")

if __name__ == "__main__":
    asyncio.run(main()) 
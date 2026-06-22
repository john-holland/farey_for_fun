import asyncio
import ipaddress
import hashlib
import json
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import aiofiles
import logging
from dataclasses import dataclass
from datetime import datetime

@dataclass
class URLNode:
    url: str
    ipv6: str
    children: List['URLNode']
    files: Dict[str, 'FileNode']
    metadata: Dict

@dataclass
class FileNode:
    path: str
    content: bytes
    metadata: Dict
    created_at: datetime
    modified_at: datetime

class FareyFS:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.root = URLNode("", "", [], {}, {})
        self.ensure_base_directory()
    
    def ensure_base_directory(self):
        """Ensure the base directory exists"""
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def url_to_ipv6(self, url: str) -> str:
        """Convert URL to IPv6 address using Farey sequence principles"""
        # Create a deterministic hash from the URL
        url_hash = hashlib.sha256(url.encode()).hexdigest()
        
        # Use the hash to generate an IPv6 address
        # Format: fd00::<hash[0:4]>:<hash[4:8]>:<hash[8:12]>
        ipv6_parts = [
            "fd00",
            url_hash[0:4],
            url_hash[4:8],
            url_hash[8:12]
        ]
        
        return ":".join(ipv6_parts)
    
    def get_farey_sequence(self, n: int) -> List[Tuple[int, int]]:
        """Generate Farey sequence of order n"""
        def gcd(a: int, b: int) -> int:
            while b:
                a, b = b, a % b
            return a
        
        farey = []
        for i in range(1, n + 1):
            for j in range(i + 1, n + 1):
                if gcd(i, j) == 1:
                    farey.append((i, j))
        return sorted(farey, key=lambda x: x[0] / x[1])
    
    def create_url_tree(self, url: str) -> URLNode:
        """Create a URL tree node with IPv6 address"""
        parts = url.split('/')
        current = self.root
        
        for part in parts:
            if not part:
                continue
                
            # Find or create child node
            child = next((c for c in current.children if c.url == part), None)
            if not child:
                child_url = f"{current.url}/{part}" if current.url else part
                child = URLNode(
                    url=child_url,
                    ipv6=self.url_to_ipv6(child_url),
                    children=[],
                    files={},
                    metadata={
                        "created_at": datetime.now().isoformat(),
                        "farey_sequence": self.get_farey_sequence(len(child_url))
                    }
                )
                current.children.append(child)
            current = child
        
        return current
    
    async def add_file(self, url: str, path: str, content: bytes) -> bool:
        """Add a file to the URL tree"""
        try:
            node = self.create_url_tree(url)
            file_path = Path(path)
            
            # Create file node
            file_node = FileNode(
                path=str(file_path),
                content=content,
                metadata={
                    "size": len(content),
                    "mime_type": self.guess_mime_type(content),
                    "farey_sequence": self.get_farey_sequence(len(content))
                },
                created_at=datetime.now(),
                modified_at=datetime.now()
            )
            
            node.files[str(file_path)] = file_node
            
            # Save to disk
            await self.save_node(node)
            return True
        except Exception as e:
            logging.error(f"Error adding file: {e}")
            return False
    
    async def get_file(self, url: str, path: str) -> Optional[FileNode]:
        """Get a file from the URL tree"""
        try:
            node = self.create_url_tree(url)
            return node.files.get(path)
        except Exception as e:
            logging.error(f"Error getting file: {e}")
            return None
    
    async def save_node(self, node: URLNode):
        """Save a node to disk"""
        try:
            node_path = self.base_path / node.ipv6.replace(':', '_')
            node_path.mkdir(parents=True, exist_ok=True)
            
            # Save node metadata
            async with aiofiles.open(node_path / "metadata.json", "w") as f:
                await f.write(json.dumps({
                    "url": node.url,
                    "ipv6": node.ipv6,
                    "metadata": node.metadata
                }, indent=2))
            
            # Save files
            for file_path, file_node in node.files.items():
                file_dir = node_path / Path(file_path).parent
                file_dir.mkdir(parents=True, exist_ok=True)
                
                async with aiofiles.open(node_path / file_path, "wb") as f:
                    await f.write(file_node.content)
                
                async with aiofiles.open(node_path / f"{file_path}.meta", "w") as f:
                    await f.write(json.dumps({
                        "path": file_node.path,
                        "metadata": file_node.metadata,
                        "created_at": file_node.created_at.isoformat(),
                        "modified_at": file_node.modified_at.isoformat()
                    }, indent=2))
        except Exception as e:
            logging.error(f"Error saving node: {e}")
    
    def guess_mime_type(self, content: bytes) -> str:
        """Guess MIME type from content"""
        # Simple MIME type detection
        if content.startswith(b'%PDF'):
            return 'application/pdf'
        elif content.startswith(b'\x89PNG'):
            return 'image/png'
        elif content.startswith(b'\xff\xd8'):
            return 'image/jpeg'
        elif content.startswith(b'<!DOCTYPE html') or content.startswith(b'<html'):
            return 'text/html'
        else:
            return 'application/octet-stream'
    
    async def search(self, query: str) -> List[Dict]:
        """Search through the filesystem"""
        results = []
        
        async def search_node(node: URLNode):
            # Search in URL
            if query.lower() in node.url.lower():
                results.append({
                    "type": "url",
                    "url": node.url,
                    "ipv6": node.ipv6,
                    "metadata": node.metadata
                })
            
            # Search in files
            for file_path, file_node in node.files.items():
                if query.lower() in file_path.lower():
                    results.append({
                        "type": "file",
                        "url": node.url,
                        "path": file_path,
                        "metadata": file_node.metadata
                    })
            
            # Search in children
            for child in node.children:
                await search_node(child)
        
        await search_node(self.root)
        return results

async def main():
    # Example usage
    fareyfs = FareyFS("./fareyfs_data")
    
    # Add a file
    url = "https://example.com/docs"
    path = "readme.txt"
    content = b"Hello, FareyFS!"
    
    success = await fareyfs.add_file(url, path, content)
    if success:
        print(f"Added file to {url}/{path}")
        
        # Get the file
        file_node = await fareyfs.get_file(url, path)
        if file_node:
            print(f"File content: {file_node.content.decode()}")
            print(f"File metadata: {file_node.metadata}")
        
        # Search
        results = await fareyfs.search("readme")
        print(f"Search results: {results}")

if __name__ == "__main__":
    asyncio.run(main()) 
import asyncio
import yaml
from pathlib import Path
from typing import Dict, List, Optional
import logging
from features.feature_manager import FeatureManager

class BatBeltIntegration:
    def __init__(self, config_path: str):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.feature_manager = FeatureManager(config_path)
        self.shortcuts = self.config['fareyfs']['bat_belt']['shortcuts']
        self.logger = logging.getLogger(__name__)
    
    async def is_enabled(self) -> bool:
        """Check if Bat_Belt integration is enabled"""
        return await self.feature_manager.is_feature_enabled('bat-belt-shortcuts')
    
    async def handle_command(self, command: str, args: Dict[str, str]) -> Optional[str]:
        """Handle a Bat_Belt command"""
        if not await self.is_enabled():
            return "Bat_Belt integration is disabled"
        
        try:
            if command == "search":
                return await self._handle_search(args.get('query', ''))
            elif command == "upload":
                return await self._handle_upload(args.get('file', ''), args.get('path', ''))
            elif command == "get":
                return await self._handle_get(args.get('path', ''))
            elif command == "list":
                return await self._handle_list(args.get('path', ''))
            else:
                return f"Unknown command: {command}"
        except Exception as e:
            self.logger.error(f"Error handling command {command}: {e}")
            return f"Error: {str(e)}"
    
    async def _handle_search(self, query: str) -> str:
        """Handle search command"""
        if not query:
            return "Error: Query is required"
        
        # TODO: Implement FareyFS search
        return f"Searching for: {query}"
    
    async def _handle_upload(self, file_path: str, target_path: str) -> str:
        """Handle upload command"""
        if not file_path or not target_path:
            return "Error: File path and target path are required"
        
        # TODO: Implement FareyFS upload
        return f"Uploading {file_path} to {target_path}"
    
    async def _handle_get(self, path: str) -> str:
        """Handle get command"""
        if not path:
            return "Error: Path is required"
        
        # TODO: Implement FareyFS get
        return f"Getting file from {path}"
    
    async def _handle_list(self, path: str) -> str:
        """Handle list command"""
        if not path:
            return "Error: Path is required"
        
        # TODO: Implement FareyFS list
        return f"Listing contents of {path}"
    
    def get_available_commands(self) -> List[Dict[str, str]]:
        """Get list of available commands"""
        return self.shortcuts['commands']

async def main():
    # Example usage
    integration = BatBeltIntegration("config.yaml")
    
    # Check if enabled
    is_enabled = await integration.is_enabled()
    print(f"Bat_Belt integration enabled: {is_enabled}")
    
    # Get available commands
    commands = integration.get_available_commands()
    print("Available commands:")
    for cmd in commands:
        print(f"- {cmd['name']}: {cmd['description']}")
    
    # Handle a command
    result = await integration.handle_command("search", {"query": "test"})
    print(f"Command result: {result}")

if __name__ == "__main__":
    asyncio.run(main()) 
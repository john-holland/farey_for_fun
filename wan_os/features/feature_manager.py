import asyncio
import aiohttp
import yaml
import logging
from typing import Dict, List, Optional
from datetime import datetime
import ipaddress
import json
from pathlib import Path

class FeatureManager:
    def __init__(self, config_path: str):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.unleash_url = self.config['unleash']['api_url']
        self.api_key = self.config['unleash']['api_key']
        self.session = None
        self.ip_lists = {
            'blacklist': set(),
            'whitelist': set()
        }
        self.load_ip_lists()
    
    def load_ip_lists(self):
        """Load IP lists from disk"""
        try:
            ip_lists_path = Path('ip_lists.json')
            if ip_lists_path.exists():
                with open(ip_lists_path, 'r') as f:
                    data = json.load(f)
                    self.ip_lists['blacklist'] = set(data.get('blacklist', []))
                    self.ip_lists['whitelist'] = set(data.get('whitelist', []))
        except Exception as e:
            logging.error(f"Error loading IP lists: {e}")
    
    def save_ip_lists(self):
        """Save IP lists to disk"""
        try:
            with open('ip_lists.json', 'w') as f:
                json.dump({
                    'blacklist': list(self.ip_lists['blacklist']),
                    'whitelist': list(self.ip_lists['whitelist'])
                }, f, indent=2)
        except Exception as e:
            logging.error(f"Error saving IP lists: {e}")
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={'Authorization': f'Bearer {self.api_key}'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def is_feature_enabled(self, feature_name: str, context: Dict = None) -> bool:
        """Check if a feature is enabled"""
        try:
            async with self.session.get(
                f"{self.unleash_url}/api/client/features/{feature_name}",
                params={'context': json.dumps(context or {})}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('enabled', False)
                return False
        except Exception as e:
            logging.error(f"Error checking feature: {e}")
            return False
    
    def is_ip_allowed(self, ip: str) -> bool:
        """Check if an IP is allowed based on whitelist/blacklist"""
        try:
            ip_obj = ipaddress.ip_address(ip)
            
            # Check whitelist first
            if self.ip_lists['whitelist']:
                return str(ip_obj) in self.ip_lists['whitelist']
            
            # Then check blacklist
            return str(ip_obj) not in self.ip_lists['blacklist']
        except ValueError:
            return False
    
    def add_to_blacklist(self, ip: str):
        """Add an IP to the blacklist"""
        try:
            ip_obj = ipaddress.ip_address(ip)
            self.ip_lists['blacklist'].add(str(ip_obj))
            self.save_ip_lists()
        except ValueError as e:
            logging.error(f"Invalid IP address: {e}")
    
    def add_to_whitelist(self, ip: str):
        """Add an IP to the whitelist"""
        try:
            ip_obj = ipaddress.ip_address(ip)
            self.ip_lists['whitelist'].add(str(ip_obj))
            self.save_ip_lists()
        except ValueError as e:
            logging.error(f"Invalid IP address: {e}")
    
    def remove_from_blacklist(self, ip: str):
        """Remove an IP from the blacklist"""
        self.ip_lists['blacklist'].discard(ip)
        self.save_ip_lists()
    
    def remove_from_whitelist(self, ip: str):
        """Remove an IP from the whitelist"""
        self.ip_lists['whitelist'].discard(ip)
        self.save_ip_lists()
    
    async def log_access(self, ip: str, feature: str, allowed: bool):
        """Log access attempt"""
        try:
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'ip': ip,
                'feature': feature,
                'allowed': allowed,
                'whitelisted': str(ipaddress.ip_address(ip)) in self.ip_lists['whitelist'],
                'blacklisted': str(ipaddress.ip_address(ip)) in self.ip_lists['blacklist']
            }
            
            log_path = Path('access_logs.jsonl')
            with open(log_path, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        except Exception as e:
            logging.error(f"Error logging access: {e}")

async def main():
    # Example usage
    async with FeatureManager("config.yaml") as manager:
        # Check feature toggle
        is_enabled = await manager.is_feature_enabled("new-ui", {
            "userId": "123",
            "ipAddress": "192.168.1.1"
        })
        print(f"Feature enabled: {is_enabled}")
        
        # IP management
        manager.add_to_whitelist("192.168.1.1")
        manager.add_to_blacklist("10.0.0.1")
        
        # Check IP access
        print(f"IP allowed: {manager.is_ip_allowed('192.168.1.1')}")
        
        # Log access
        await manager.log_access("192.168.1.1", "new-ui", True)

if __name__ == "__main__":
    asyncio.run(main()) 
import asyncio
import ldap3
import yaml
import json
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class User:
    username: str
    email: str
    ssh_keys: List[str]
    local_dirs: List[str]
    last_login: datetime
    trust_level: float
    service_backoff: Dict[str, float]

class UserManager:
    def __init__(self, config_path: str):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.ldap_config = self.config.get('ldap', {})
        self.users_file = Path('users.json')
        self.users: Dict[str, User] = {}
        self.load_users()
        
        # Trust backoff configuration
        self.max_trust = 1.0
        self.min_trust = 0.1
        self.backoff_factor = 0.5
        self.recovery_rate = 0.1
        
    def load_users(self):
        """Load users from disk"""
        if self.users_file.exists():
            with open(self.users_file, 'r') as f:
                data = json.load(f)
                for username, user_data in data.items():
                    self.users[username] = User(
                        username=username,
                        email=user_data['email'],
                        ssh_keys=user_data['ssh_keys'],
                        local_dirs=user_data['local_dirs'],
                        last_login=datetime.fromisoformat(user_data['last_login']),
                        trust_level=user_data['trust_level'],
                        service_backoff=user_data['service_backoff']
                    )
    
    def save_users(self):
        """Save users to disk"""
        data = {
            username: {
                'email': user.email,
                'ssh_keys': user.ssh_keys,
                'local_dirs': user.local_dirs,
                'last_login': user.last_login.isoformat(),
                'trust_level': user.trust_level,
                'service_backoff': user.service_backoff
            }
            for username, user in self.users.items()
        }
        with open(self.users_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    async def authenticate_user(self, username: str, password: str) -> bool:
        """Authenticate user against LDAP"""
        try:
            server = ldap3.Server(self.ldap_config['server'])
            conn = ldap3.Connection(
                server,
                user=f"{username}@{self.ldap_config['domain']}",
                password=password
            )
            if conn.bind():
                await self.update_user_trust(username, True)
                return True
            await self.update_user_trust(username, False)
            return False
        except Exception as e:
            print(f"LDAP authentication error: {e}")
            return False
    
    async def update_user_trust(self, username: str, success: bool):
        """Update user trust level based on authentication success"""
        if username not in self.users:
            return
        
        user = self.users[username]
        if success:
            # Gradual trust recovery
            user.trust_level = min(
                self.max_trust,
                user.trust_level + self.recovery_rate
            )
        else:
            # Trust backoff
            user.trust_level = max(
                self.min_trust,
                user.trust_level * self.backoff_factor
            )
        
        user.last_login = datetime.now()
        self.save_users()
    
    def add_ssh_key(self, username: str, key: str):
        """Add SSH key for user"""
        if username not in self.users:
            return
        
        user = self.users[username]
        if key not in user.ssh_keys:
            user.ssh_keys.append(key)
            self.save_users()
    
    def remove_ssh_key(self, username: str, key: str):
        """Remove SSH key for user"""
        if username not in self.users:
            return
        
        user = self.users[username]
        if key in user.ssh_keys:
            user.ssh_keys.remove(key)
            self.save_users()
    
    def add_local_dir(self, username: str, dir_path: str):
        """Add local directory for user"""
        if username not in self.users:
            return
        
        user = self.users[username]
        if dir_path not in user.local_dirs:
            user.local_dirs.append(dir_path)
            self.save_users()
    
    def remove_local_dir(self, username: str, dir_path: str):
        """Remove local directory for user"""
        if username not in self.users:
            return
        
        user = self.users[username]
        if dir_path in user.local_dirs:
            user.local_dirs.remove(dir_path)
            self.save_users()
    
    def get_service_backoff(self, username: str, service: str) -> float:
        """Get service backoff time for user"""
        if username not in self.users:
            return 0.0
        
        user = self.users[username]
        return user.service_backoff.get(service, 0.0)
    
    def update_service_backoff(self, username: str, service: str, backoff_time: float):
        """Update service backoff time for user"""
        if username not in self.users:
            return
        
        user = self.users[username]
        user.service_backoff[service] = backoff_time
        self.save_users()
    
    def can_access_service(self, username: str, service: str) -> bool:
        """Check if user can access service based on trust and backoff"""
        if username not in self.users:
            return False
        
        user = self.users[username]
        backoff_time = user.service_backoff.get(service, 0.0)
        
        if backoff_time > time.time():
            return False
        
        # Require higher trust for sensitive services
        if service in ['admin', 'system']:
            return user.trust_level >= 0.8
        elif service in ['file_upload', 'directory_management']:
            return user.trust_level >= 0.5
        
        return user.trust_level >= 0.3

async def main():
    # Example usage
    manager = UserManager("config.yaml")
    
    # Authenticate user
    success = await manager.authenticate_user("john", "password123")
    print(f"Authentication success: {success}")
    
    # Add SSH key
    manager.add_ssh_key("john", "ssh-rsa AAAAB3NzaC1yc2E...")
    
    # Add local directory
    manager.add_local_dir("john", "/home/john/documents")
    
    # Check service access
    can_access = manager.can_access_service("john", "file_upload")
    print(f"Can access file_upload: {can_access}")

if __name__ == "__main__":
    asyncio.run(main()) 
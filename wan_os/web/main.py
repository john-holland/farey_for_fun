from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import yaml
from pathlib import Path
import sys
import jwt
from datetime import datetime, timedelta
sys.path.append(str(Path(__file__).parent.parent))
from features.feature_manager import FeatureManager
from fareyfs.fareyfs import FareyFS
from auth.user_manager import UserManager
from bat_belt.integration import BatBeltIntegration

app = FastAPI(title="Farey WAN OS Web Interface")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class IPAddress(BaseModel):
    ip: str

class FeatureToggle(BaseModel):
    name: str
    enabled: bool
    context: Optional[Dict] = None

class FileUpload(BaseModel):
    url: str
    path: str
    content: bytes

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class SSHKey(BaseModel):
    key: str

class LocalDirectory(BaseModel):
    path: str

class BatBeltCommand(BaseModel):
    command: str

# Dependencies
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_feature_manager():
    async with FeatureManager("config.yaml") as manager:
        yield manager

async def get_fareyfs():
    fareyfs = FareyFS("./fareyfs_data")
    yield fareyfs

async def get_user_manager():
    manager = UserManager("config.yaml")
    yield manager

async def get_bat_belt():
    integration = BatBeltIntegration("config.yaml")
    yield integration

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_manager: UserManager = Depends(get_user_manager)
):
    try:
        payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth routes
@app.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_manager: UserManager = Depends(get_user_manager)
):
    success = await user_manager.authenticate_user(form_data.username, form_data.password)
    if not success:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = jwt.encode(
        {
            "sub": form_data.username,
            "exp": datetime.utcnow() + timedelta(hours=24)
        },
        "your-secret-key",
        algorithm="HS256"
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User management routes
@app.post("/users")
async def create_user(
    user: UserCreate,
    user_manager: UserManager = Depends(get_user_manager)
):
    # In a real implementation, this would create a user in LDAP
    return {"status": "success", "username": user.username}

@app.post("/users/{username}/ssh-keys")
async def add_ssh_key(
    username: str,
    key: SSHKey,
    current_user: str = Depends(get_current_user),
    user_manager: UserManager = Depends(get_user_manager)
):
    if current_user != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user_manager.add_ssh_key(username, key.key)
    return {"status": "success"}

@app.delete("/users/{username}/ssh-keys")
async def remove_ssh_key(
    username: str,
    key: SSHKey,
    current_user: str = Depends(get_current_user),
    user_manager: UserManager = Depends(get_user_manager)
):
    if current_user != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user_manager.remove_ssh_key(username, key.key)
    return {"status": "success"}

@app.post("/users/{username}/local-dirs")
async def add_local_dir(
    username: str,
    directory: LocalDirectory,
    current_user: str = Depends(get_current_user),
    user_manager: UserManager = Depends(get_user_manager)
):
    if current_user != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not user_manager.can_access_service(username, "directory_management"):
        raise HTTPException(status_code=403, detail="Service access denied")
    
    user_manager.add_local_dir(username, directory.path)
    return {"status": "success"}

@app.delete("/users/{username}/local-dirs")
async def remove_local_dir(
    username: str,
    directory: LocalDirectory,
    current_user: str = Depends(get_current_user),
    user_manager: UserManager = Depends(get_user_manager)
):
    if current_user != username:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not user_manager.can_access_service(username, "directory_management"):
        raise HTTPException(status_code=403, detail="Service access denied")
    
    user_manager.remove_local_dir(username, directory.path)
    return {"status": "success"}

# Existing routes with authentication
@app.get("/features")
async def list_features(
    manager: FeatureManager = Depends(get_feature_manager),
    current_user: str = Depends(get_current_user),
    user_manager: UserManager = Depends(get_user_manager)
):
    if not user_manager.can_access_service(current_user, "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return manager.config['unleash']['features']

@app.post("/features/{feature_name}")
async def toggle_feature(
    feature_name: str,
    toggle: FeatureToggle,
    manager: FeatureManager = Depends(get_feature_manager)
):
    # In a real implementation, this would call Unleash API
    return {"status": "success", "feature": feature_name, "enabled": toggle.enabled}

@app.get("/ip/whitelist")
async def get_whitelist(manager: FeatureManager = Depends(get_feature_manager)):
    return list(manager.ip_lists['whitelist'])

@app.get("/ip/blacklist")
async def get_blacklist(manager: FeatureManager = Depends(get_feature_manager)):
    return list(manager.ip_lists['blacklist'])

@app.post("/ip/whitelist")
async def add_to_whitelist(
    ip: IPAddress,
    manager: FeatureManager = Depends(get_feature_manager)
):
    manager.add_to_whitelist(ip.ip)
    return {"status": "success", "ip": ip.ip}

@app.post("/ip/blacklist")
async def add_to_blacklist(
    ip: IPAddress,
    manager: FeatureManager = Depends(get_feature_manager)
):
    manager.add_to_blacklist(ip.ip)
    return {"status": "success", "ip": ip.ip}

@app.delete("/ip/whitelist/{ip}")
async def remove_from_whitelist(
    ip: str,
    manager: FeatureManager = Depends(get_feature_manager)
):
    manager.remove_from_whitelist(ip)
    return {"status": "success", "ip": ip}

@app.delete("/ip/blacklist/{ip}")
async def remove_from_blacklist(
    ip: str,
    manager: FeatureManager = Depends(get_feature_manager)
):
    manager.remove_from_blacklist(ip)
    return {"status": "success", "ip": ip}

@app.get("/logs")
async def get_logs(manager: FeatureManager = Depends(get_feature_manager)):
    try:
        with open('access_logs.jsonl', 'r') as f:
            logs = [line.strip() for line in f.readlines()]
        return logs
    except FileNotFoundError:
        return []

@app.post("/files")
async def add_file(
    file: FileUpload,
    fareyfs: FareyFS = Depends(get_fareyfs)
):
    success = await fareyfs.add_file(file.url, file.path, file.content)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add file")
    return {"status": "success", "url": file.url, "path": file.path}

@app.get("/files/search")
async def search_files(
    query: str,
    fareyfs: FareyFS = Depends(get_fareyfs)
):
    results = await fareyfs.search(query)
    return results

# Bat_Belt routes
@app.get("/bat-belt/commands")
async def get_bat_belt_commands(
    integration: BatBeltIntegration = Depends(get_bat_belt)
):
    return integration.get_available_commands()

@app.post("/bat-belt/execute")
async def execute_bat_belt_command(
    command: BatBeltCommand,
    integration: BatBeltIntegration = Depends(get_bat_belt)
):
    result = await integration.handle_command(command.command, {})
    return {"result": result}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
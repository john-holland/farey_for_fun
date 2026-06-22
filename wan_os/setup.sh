#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Setting up WAN OS development environment...${NC}"

# Install Python dependencies
echo -e "${GREEN}Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Install Node.js dependencies for Ship
echo -e "${GREEN}Installing Ship dependencies...${NC}"
cd ship
npm install
cd ..

# Install Node.js dependencies for Dailiance
echo -e "${GREEN}Installing Dailiance dependencies...${NC}"
cd ../dailiance
npm install
cd ../wan_os

# Make scripts executable
chmod +x start_local.sh
chmod +x setup.sh

echo -e "${BLUE}Setup complete! You can now run ./start_local.sh to start all services.${NC}" 
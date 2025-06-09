#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting WAN OS Local Development Environment...${NC}"

# Create necessary directories
mkdir -p ./data/fareyfs
mkdir -p ./data/cache
mkdir -p ./logs

# Start WAN OS base system
echo -e "${GREEN}Starting WAN OS base system...${NC}"
python -m uvicorn web.main:app --host 0.0.0.0 --port 8000 --reload > ./logs/wan_os.log 2>&1 &
WAN_OS_PID=$!

# Wait for WAN OS to start
sleep 5

# Start Dailiance
echo -e "${GREEN}Starting Dailiance...${NC}"
cd ../dailiance
npm run dev > ../wan_os/logs/dailiance.log 2>&1 &
DAILANCE_PID=$!

# Go back to WAN OS directory
cd ../wan_os

# Start Ship monitoring
echo -e "${GREEN}Starting Ship monitoring...${NC}"
cd ship
npm start > ../logs/ship.log 2>&1 &
SHIP_PID=$!

# Save PIDs to file for later cleanup
echo "WAN_OS_PID=$WAN_OS_PID" > ../.pids
echo "DAILANCE_PID=$DAILANCE_PID" >> ../.pids
echo "SHIP_PID=$SHIP_PID" >> ../.pids

echo -e "${BLUE}All services started!${NC}"
echo -e "WAN OS: http://localhost:8000"
echo -e "Dailiance: http://localhost:3000"
echo -e "Ship monitoring is running"

# Function to cleanup on exit
cleanup() {
    echo -e "${BLUE}Shutting down services...${NC}"
    if [ -f ../.pids ]; then
        source ../.pids
        kill $WAN_OS_PID $DAILANCE_PID $SHIP_PID 2>/dev/null
        rm ../.pids
    fi
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Keep script running
wait 
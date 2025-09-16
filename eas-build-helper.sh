#!/bin/bash

# eas-build-helper.sh - Helper script for EAS builds
# Usage: ./eas-build-helper.sh [platform] [profile]
# Example: ./eas-build-helper.sh ios preview

# Default values
PLATFORM=${1:-ios}
PROFILE=${2:-preview}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display a header
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}EAS Build Helper - Platform: $PLATFORM, Profile: $PROFILE${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Verify package.json and package-lock.json are in sync
echo -e "${YELLOW}Step 1: Verifying package dependencies...${NC}"
npm install --package-lock-only
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to sync package-lock.json. Fix package.json issues first.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Package dependencies verified${NC}"

# Step 2: Verify babel.config.js has module-resolver configured
echo -e "${YELLOW}Step 2: Checking babel.config.js...${NC}"
if ! grep -q "module-resolver" babel.config.js; then
  echo -e "${RED}Warning: babel.config.js may not have module-resolver configured.${NC}"
  echo -e "${YELLOW}This could cause @/ import alias resolution failures.${NC}"
else
  echo -e "${GREEN}✓ babel.config.js has module-resolver${NC}"
fi

# Step 3: Verify app.config.js exists and has valid format
echo -e "${YELLOW}Step 3: Verifying app.config.js...${NC}"
if [ ! -f app.config.js ]; then
  echo -e "${RED}Error: app.config.js not found${NC}"
  exit 1
fi
node -e "try { require('./app.config.js'); console.log('Valid app.config.js'); } catch (e) { console.error('Invalid app.config.js:', e.message); process.exit(1); }"
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: app.config.js has syntax errors${NC}"
  exit 1
fi
echo -e "${GREEN}✓ app.config.js is valid${NC}"

# Step 4: Run EAS build
echo -e "${YELLOW}Step 4: Running EAS build...${NC}"
echo -e "${BLUE}Command: eas build --platform $PLATFORM --profile $PROFILE${NC}"
eas build --platform $PLATFORM --profile $PROFILE

# Check if build started successfully
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: EAS build command failed${NC}"
  exit 1
fi

echo -e "${GREEN}Build process started successfully!${NC}"
echo -e "${BLUE}Note: Check the EAS build dashboard for build progress and logs${NC}"
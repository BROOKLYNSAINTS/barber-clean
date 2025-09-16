#!/bin/bash
# run-test.sh
# Script to run the user permissions test with environment variables loaded

echo "🧪 Running user permissions test..."

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  
  # Export all variables from .env file
  export $(grep -v '^#' .env | xargs)
  
  # Run the test
  echo "Running test..."
  node test-user-permissions.cjs
else
  echo "❌ .env file not found! Using fallback values."
  node test-user-permissions.cjs
fi

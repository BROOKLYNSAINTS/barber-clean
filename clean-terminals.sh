#!/bin/bash
# clean-terminals.sh - Script to clean up terminal processes

echo "🧹 Cleaning up terminal processes..."

# Find and kill any firebase emulators
echo "🔍 Looking for Firebase emulator processes..."
firebase_pids=$(ps -ef | grep -E 'firebase emulators' | grep -v grep | awk '{print $2}')
if [ -n "$firebase_pids" ]; then
  echo "🔥 Found Firebase emulator processes. Stopping them..."
  for pid in $firebase_pids; do
    echo "  Killing process $pid"
    kill -9 $pid 2>/dev/null
  done
  echo "✅ Firebase emulators stopped."
else
  echo "✅ No Firebase emulator processes found."
fi

# Find and kill any running node scripts related to your project
echo "🔍 Looking for node processes related to your project..."
node_pids=$(ps -ef | grep -E 'node .*(firebase|test|emulator)' | grep -v grep | awk '{print $2}')
if [ -n "$node_pids" ]; then
  echo "🔗 Found related Node.js processes. Stopping them..."
  for pid in $node_pids; do
    echo "  Killing process $pid"
    kill -9 $pid 2>/dev/null
  done
  echo "✅ Related Node.js processes stopped."
else
  echo "✅ No related Node.js processes found."
fi

# Restore the original Firebase config if backup exists
if [ -f "./src/services/firebaseConfig.js.bak" ]; then
  echo "🔄 Restoring original Firebase configuration..."
  cp ./src/services/firebaseConfig.js.bak ./src/services/firebaseConfig.js
  echo "✅ Original Firebase configuration restored."
fi

echo ""
echo "🎉 Terminal cleanup complete! You may now close any remaining terminal tabs in VS Code."
echo "💡 Tip: Use the trash icon in VS Code's terminal panel to close terminals."
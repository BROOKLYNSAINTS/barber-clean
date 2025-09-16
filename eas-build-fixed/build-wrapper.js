// Register TypeScript handler
require('./register');

// Run the actual build process
require('@expo/cli').run(['build', '--platform', 'ios', '--profile', 'preview', '--non-interactive']);

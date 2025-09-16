# Firebase Database Switching

This app has been configured to work with two Firebase databases:

1. **Test Database**: barber-38b88
2. **Production Database**: barberapp-prod-2d197

## How to Switch Databases During Testing

When you're in the development environment (not TestFlight/App Store), you'll now see a database selector button in the bottom right corner of the login screen:

- It will show either "TEST DB" or "PROD DB" to indicate which database you're currently using
- Tap it to open the database selector panel
- Use the switch to toggle between databases
- The app will reload after switching

## Default Behavior

- In development: Test database (barber-38b88) is used by default
- In TestFlight/App Store: Production database (barberapp-prod-2d197) is always used

## Technical Implementation

The database switching functionality is implemented in:
- `src/services/firebaseConfigManager.js` - The core logic for selecting the correct database
- `src/components/DatabaseSelector.js` - The UI component for switching databases during testing

## Important Notes

1. User accounts are separate between the two databases - you need to create accounts in each database separately
2. Your choice of database in development is saved between app launches
3. In TestFlight/App Store builds, the production database is always used regardless of settings

## How It Works

When you switch databases:
1. The selection is saved to AsyncStorage
2. The Firebase configuration is updated to point to the selected database
3. The app reloads to apply the changes

## Troubleshooting

If you encounter login issues:
1. Check which database you're currently using (shown in the database selector)
2. Verify that you've created a user account in that specific database
3. If needed, switch to the other database where your test account exists

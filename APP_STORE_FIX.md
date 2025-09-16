# App Store Connect Rejection Fix

## Issue
The app was rejected from App Store Connect due to missing privacy usage descriptions in the Info.plist file. 

## Fixes Made

1. Added missing privacy usage descriptions in the iOS Info.plist file:
   - Added `NSSpeechRecognitionUsageDescription`
   - Enhanced all existing privacy descriptions with more specific text

2. Updated privacy descriptions in app.config.js:
   - Added all required usage descriptions in the infoPlist section
   - Incremented the buildNumber from "59" to "60"

3. Privacy descriptions now include:

| Privacy Key | Description |
|-------------|-------------|
| NSCalendarsUsageDescription | We use calendar access to schedule and manage your barber appointments |
| NSCameraUsageDescription | We need camera access to capture profile pictures and haircut photos |
| NSPhotoLibraryUsageDescription | We need photo library access to upload profile pictures and haircut references |
| NSMicrophoneUsageDescription | We need microphone access for voice commands and virtual consultations |
| NSRemindersUsageDescription | We use reminders to help you remember upcoming barber appointments |
| NSSpeechRecognitionUsageDescription | We use speech recognition for voice commands to book and manage appointments |

## Next Steps

1. Wait for the EAS build to complete
2. Once completed, submit the new build to TestFlight using:
   ```
   eas submit -p ios --latest
   ```
3. After TestFlight review, submit for App Store review

## Notes for Future App Updates

- Always include all required privacy usage descriptions even if you're not directly using the API
- Some libraries/SDKs might reference these APIs indirectly requiring these descriptions
- Privacy descriptions should be specific and clearly explain why your app needs access to these features
- Keep the build number incremented for each submission
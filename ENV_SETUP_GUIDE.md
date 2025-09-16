# Environment Variable Setup Guide for EAS Builds

This guide explains how to properly handle environment variables and API keys for development and production builds.

## Local Development

1. Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your actual API keys.

3. Ensure `.env` is listed in `.gitignore` to prevent committing sensitive information.

## Setting Up EAS Secrets for Secure Builds

For CI/CD builds with EAS, you'll need to set up secrets that can be securely used during the build process.

### Add Secrets to EAS

```bash
# For development/test Firebase config
eas secret:create --scope project --name FIREBASE_DEV_API_KEY --value "your_dev_api_key"
eas secret:create --scope project --name FIREBASE_DEV_AUTH_DOMAIN --value "your_dev_auth_domain"
eas secret:create --scope project --name FIREBASE_DEV_PROJECT_ID --value "your_dev_project_id"
eas secret:create --scope project --name FIREBASE_DEV_STORAGE_BUCKET --value "your_dev_storage_bucket"
eas secret:create --scope project --name FIREBASE_DEV_MESSAGING_SENDER_ID --value "your_dev_messaging_sender_id"
eas secret:create --scope project --name FIREBASE_DEV_APP_ID --value "your_dev_app_id"
eas secret:create --scope project --name FIREBASE_DEV_MEASUREMENT_ID --value "your_dev_measurement_id"

# For production Firebase config
eas secret:create --scope project --name FIREBASE_PROD_API_KEY --value "your_prod_api_key"
eas secret:create --scope project --name FIREBASE_PROD_AUTH_DOMAIN --value "your_prod_auth_domain"
eas secret:create --scope project --name FIREBASE_PROD_PROJECT_ID --value "your_prod_project_id"
eas secret:create --scope project --name FIREBASE_PROD_STORAGE_BUCKET --value "your_prod_storage_bucket"
eas secret:create --scope project --name FIREBASE_PROD_MESSAGING_SENDER_ID --value "your_prod_messaging_sender_id"
eas secret:create --scope project --name FIREBASE_PROD_APP_ID --value "your_prod_app_id"
eas secret:create --scope project --name FIREBASE_PROD_MEASUREMENT_ID --value "your_prod_measurement_id"

# Other API keys
eas secret:create --scope project --name STRIPE_PUBLISHABLE_KEY --value "your_stripe_key"
eas secret:create --scope project --name OPENAI_API_KEY --value "your_openai_key"
```

### Verify Secrets

You can check that your secrets are properly set up with:

```bash
eas secret:list
```

## How it Works

1. During EAS builds, the `eas-build-pre-install` script runs `eas-build.js`.
2. `eas-build.js` reads the existing `.env` file (or creates one if it doesn't exist).
3. The script adds or updates environment variables from EAS Secrets.
4. The app.config.js file then uses these environment variables from process.env.
5. The app uses the appropriate configuration based on the build environment.

## Handling Different Environments

- **Development**: Uses test Firebase database by default
- **TestFlight**: Always uses test Firebase database
- **App Store**: Always uses production Firebase database

This setup ensures that:
1. API keys are never committed to GitHub
2. CI/CD builds have access to the required secrets
3. Each environment uses the appropriate database configuration

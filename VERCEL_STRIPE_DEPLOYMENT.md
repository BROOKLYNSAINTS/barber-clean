# Deploying Stripe Backend to Vercel

This guide explains how to deploy your Stripe backend to Vercel correctly, ensuring proper webhook handling and environment configuration.

## Setting Up Vercel Project

1. **Create a new project on Vercel**:
   - Create a new directory for your backend project
   - Initialize a Git repository

2. **Create API Routes**:
   - Create an `api` folder in your project root
   - Add the following files (already provided):
     - `api/create-payment-intent.js`
     - `api/webhook.js`

3. **Add a `package.json` file**:
   ```json
   {
     "name": "barber-backend",
     "version": "1.0.0",
     "description": "Barber app payment backend",
     "engines": {
       "node": ">=14.0.0"
     },
     "dependencies": {
       "stripe": "^12.0.0"
     }
   }
   ```

4. **Deploy to Vercel**:
   - Push to GitHub
   - Connect Vercel to your GitHub repository
   - Deploy the project

## Environment Variables Setup

1. **In Vercel Dashboard**:
   - Go to your project
   - Navigate to "Settings" > "Environment Variables"
   - Add the following variables:
     ```
     STRIPE_SECRET_KEY=sk_live_your_production_secret_key
     STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe
     ```

2. **Important**: Never commit these keys to your repository!

## Stripe Webhook Configuration

1. **In the Stripe Dashboard**:
   - Go to "Developers" > "Webhooks"
   - Click "Add Endpoint"
   - Enter your Vercel URL: `https://your-project.vercel.app/api/webhook`
   - Select the following events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

2. **Copy the Webhook Signing Secret**:
   - After creating the webhook, Stripe will show a signing secret
   - Use this as your `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

## Update Your Frontend

Update your frontend app's `stripeConfig.js` to point to your new Vercel deployment:

```javascript
// Backend URL for Stripe API calls
export const stripeBackendUrl = "https://your-project.vercel.app";
```

## Testing Your Deployment

1. **Test Health Check**:
   - Visit `https://your-project.vercel.app/api/health`
   - Should return `{"status":"healthy","environment":"production"}`

2. **Check Vercel Logs**:
   - After making a test payment, check the logs in Vercel dashboard
   - Look for successful webhook processing

## Troubleshooting

1. **Webhook Issues**:
   - Ensure the webhook URL is correct and accessible
   - Check Stripe dashboard for failed webhook attempts
   - Verify the webhook signing secret is correct

2. **Payment Intent Issues**:
   - Check Vercel logs for errors
   - Verify environment variables are set correctly
   - Test with a minimal payment amount (e.g., $1.00)

## Important Notes

1. **Serverless Functions**:
   - Vercel uses serverless functions, which have cold starts
   - First request may be slower than subsequent ones

2. **Logs**:
   - Vercel logs are not persistent, export important logs if needed
   - Consider adding application monitoring for production

3. **Security**:
   - Always use HTTPS
   - Never expose Stripe secret keys
   - Consider adding additional authentication for your API endpoints
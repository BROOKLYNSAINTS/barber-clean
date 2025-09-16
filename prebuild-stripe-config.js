// prebuild-stripe-config.js
// This is a CommonJS version of the Stripe config for use with prebuild-check.js
module.exports = {
  stripeConfig: {
    publishableKey: "pk_test_your_stripe_key_here",
    merchantIdentifier: "merchant.com.barberapp",
    urlScheme: "barberapp"
  },
  stripeBackendUrl: "https://barber-backend-ten.vercel.app"
};

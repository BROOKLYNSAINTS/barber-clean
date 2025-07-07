# Barber Clean - Mobile App

A React Native mobile application for barber shop appointments and payments.

## Features

- User authentication (Firebase)
- Appointment booking system
- Stripe payment integration
- Barber profiles and services
- Real-time notifications

## Tech Stack

- React Native / Expo
- Firebase (Authentication, Firestore)
- Stripe (Payments)
- React Navigation
- Expo Router

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Firebase credentials
4. Configure Stripe keys
5. Run the app: `npx expo start`

## Environment Variables

Create a `.env` file with:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## Backend

The backend server is in the `barber-backend` directory.

## Development Status

- ✅ Authentication system
- ✅ Basic UI components
- ✅ Stripe payment integration
- 🔄 Appointment booking (in progress)
- 📋 Admin dashboard (planned)
# MedMonitor AI - Deployment Guide

This document provides instructions for deploying the MedMonitor AI web application to production using Firebase Hosting.

## 1. Environment Setup

Create a `.env` file in the root directory based on `.env.example`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 2. Production Build

Generate the optimized production build:

```bash
npm install
npm run build
```

The build artifacts will be located in the `dist/` directory.

## 3. Firebase Deployment

### Prerequisites
- Install Firebase CLI: `npm install -g firebase-tools`
- Login to Firebase: `firebase login`

### Steps
1. Initialize the project (if not done): `firebase init hosting`
   - Select your project
   - Set `public` directory to `dist`
   - Configure as a single-page app: `Yes`
2. Deploy to hosting:
```bash
firebase deploy --only hosting
```

## 4. Post-Deployment Verification
- Check all routes for SPA fallback support.
- Verify Firebase Authentication is working with the production domain.
- Ensure Firestore security rules are deployed (handled via Firebase CLI or Console).

## 5. Optimization Features
- **Code Splitting**: Routes are lazy-loaded to reduce initial bundle size.
- **Caching**: Static assets are configured with long-term caching in `firebase.json`.
- **Minification**: Terser is used to strip console logs and minify code in production.

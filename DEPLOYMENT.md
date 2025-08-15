# Deployment Guide

## Firebase Hosting (Recommended)

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase in your project
```bash
firebase init
```

Select:
- Firestore (if not already done)
- Hosting

### 4. Configure firebase.json
The `firebase.json` file is already configured:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 5. Deploy Firestore Rules and Indexes
```bash
firebase deploy --only firestore
```

### 6. Build and Deploy
```bash
npm run build
firebase deploy --only hosting
```

## Alternative Deployment Options

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Build: `npm run build`
3. Deploy: `vercel --prod`

### Netlify
1. Build: `npm run build`
2. Drag and drop the `dist` folder to Netlify

### GitHub Pages
1. Build: `npm run build`
2. Push `dist` folder to `gh-pages` branch

## Environment Variables

No environment variables needed! Firebase config is included in the build.

## Post-Deployment Checklist

- [ ] Test authentication (email/password and Google)
- [ ] Test client creation and management
- [ ] Test transaction creation and filtering
- [ ] Test reports functionality
- [ ] Verify data persistence
- [ ] Test on mobile devices
- [ ] Check Firestore security rules are working

## Troubleshooting

### Authentication Issues
- Verify Firebase Auth is enabled
- Check authorized domains in Firebase Console
- Ensure Google OAuth is configured if using Google sign-in

### Firestore Permission Errors
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check rules in Firebase Console

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Update dependencies: `npm update`

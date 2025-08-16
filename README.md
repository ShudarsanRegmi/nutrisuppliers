# Digital Ledger - Firebase Edition

A fully client-side React application for managing business transactions with Firebase as the backend.

## 🚀 Features

- **Client-side only**: No server maintenance required
- **Firebase Authentication**: Email/password and Google sign-in
- **Real-time data**: Firestore provides real-time synchronization
- **Client Management**: Add, edit, and manage clients
- **Transaction Tracking**: Record debits and credits with running balances
- **Reports & Analytics**: Monthly totals and transaction summaries
- **Mobile-first Design**: Responsive UI built with Tailwind CSS
- **Secure**: Firestore security rules ensure data isolation

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Firebase (Authentication + Firestore)
- **UI**: Tailwind CSS, Radix UI components
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation

## 📋 Prerequisites

- Node.js 18+ 
- Firebase account
- Firebase CLI (installed globally)

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd DigitalLedger
npm install
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password and Google providers
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Choose your preferred region

### 3. Configure Firebase

1. Copy the environment template file:
```bash
cp client/.env.example client/.env
```

2. Get your Firebase project configuration:
   - Go to Firebase Console → Project Settings → General tab
   - Scroll down to "Your apps" section
   - Copy your web app's configuration

3. Update `client/.env` file with your Firebase credentials:
```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

⚠️ **Important**: Never commit your `.env` file to version control. It's already added to `.gitignore`.

### 4. Deploy Firestore Security Rules

```bash
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your app!

## 🚀 Deployment

### Deploy to Firebase Hosting

```bash
npm run build
firebase init hosting
firebase deploy
```

### Deploy to Other Platforms

Since this is a static React app, you can deploy to:
- Vercel: `vercel --prod`
- Netlify: Drag and drop the `dist` folder
- GitHub Pages: Use GitHub Actions

## 📊 Database Structure

### Firestore Collections

```
users/{userId}
├── clients/{clientId}
│   ├── name: string
│   ├── contact?: string
│   ├── email?: string
│   ├── address?: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
└── transactions/{transactionId}
    ├── clientId: string
    ├── date: timestamp
    ├── particulars: string
    ├── billNo?: string
    ├── debitAmount: string
    ├── creditAmount: string
    ├── balanceAfter: string
    └── createdAt: timestamp
```

## 🔐 Security

- **Authentication**: Firebase Auth handles user authentication
- **Authorization**: Firestore security rules ensure users can only access their own data
- **Data Isolation**: All data is scoped to the authenticated user

## 🎯 Migration from Express.js

This app has been migrated from an Express.js + PostgreSQL backend to a fully client-side Firebase solution:

### What Changed:
- ✅ Removed Express.js server
- ✅ Replaced PostgreSQL with Firestore
- ✅ Replaced Replit Auth with Firebase Auth
- ✅ Updated all API calls to use Firebase SDK
- ✅ Added real-time data synchronization
- ✅ Simplified deployment (static hosting)

### What Stayed the Same:
- ✅ All React components and UI
- ✅ Business logic and data flow
- ✅ User experience and features

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type checking
- `npm run deploy` - Deploy to Firebase

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

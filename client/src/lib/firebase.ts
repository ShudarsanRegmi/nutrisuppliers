// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableNetwork } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBi5xf0vlSheTuOCTHf45Nq-ihUYiKCweA",
  authDomain: "nutri-suppliers.firebaseapp.com",
  projectId: "nutri-suppliers",
  storageBucket: "nutri-suppliers.firebasestorage.app",
  messagingSenderId: "421640597836",
  appId: "1:421640597836:web:709cc0cb3521b895c95fe9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Ensure Firestore is online
enableNetwork(db).catch((error) => {
  console.warn("Failed to enable Firestore network:", error);
});

export default app;

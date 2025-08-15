import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";
import { createOrUpdateUser as createOrUpdateUserInDb } from "./firebaseDb";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

// Convert Firebase User to our AuthUser format
export const convertFirebaseUser = (user: User): AuthUser => ({
  id: user.uid,
  email: user.email,
  firstName: user.displayName?.split(' ')[0] || null,
  lastName: user.displayName?.split(' ').slice(1).join(' ') || null,
  profileImageUrl: user.photoURL,
});

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return convertFirebaseUser(result.user);
  } catch (error) {
    throw error;
  }
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(result.user, {
      displayName: `${firstName} ${lastName}`,
    });
    
    return convertFirebaseUser(result.user);
  } catch (error) {
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return convertFirebaseUser(result.user);
  } catch (error) {
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Create or update user in database
export const createOrUpdateUser = async (userData: Omit<AuthUser, "createdAt" | "updatedAt">) => {
  await createOrUpdateUserInDb(userData);
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(convertFirebaseUser(user));
    } else {
      callback(null);
    }
  });
};

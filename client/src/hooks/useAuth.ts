import { useState, useEffect } from "react";
import { onAuthStateChange, AuthUser, createOrUpdateUser } from "@/lib/firebaseAuth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Create or update user in Firestore
          await createOrUpdateUser({
            id: firebaseUser.id,
            email: firebaseUser.email,
            firstName: firebaseUser.firstName,
            lastName: firebaseUser.lastName,
            profileImageUrl: firebaseUser.profileImageUrl,
          });
          setUser(firebaseUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

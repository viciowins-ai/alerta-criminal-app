import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  termsAccepted: boolean | null;
  role: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  // @ts-ignore
  user: null,
  loading: true,
  termsAccepted: null,
  role: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setTermsAccepted(null);
        setRole(null);
        setLoading(false);
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = undefined;
        }
        return;
      }

      // We have a user. Listen to their terms accepted status.
      const userRef = doc(db, 'users', currentUser.uid);
      
      profileUnsubscribe = onSnapshot(userRef, (userSnap) => {
        if (userSnap.exists()) {
          setTermsAccepted(userSnap.data().termsAccepted === true);
          setRole(userSnap.data().role || 'user');
        } else {
          setTermsAccepted(false);
          setRole('user');
        }
        setLoading(false); // Auth is fully loaded once we know the terms status
      }, (error) => {
        console.error("Error listening to user profile:", error);
        setLoading(false);
      });

      // Sync user profile in background
      try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // Create new user profile
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email || `${currentUser.uid}@anonymous.com`,
            name: currentUser.displayName || 'Usuário Anônimo',
            avatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'U')}&background=random`,
            level: 'Iniciante',
            points: 0,
            role: 'user',
            termsAccepted: false,
            createdAt: serverTimestamp(),
          });
        } else {
          // Ensure existing user has all required fields to prevent 403 on updates
          const data = userSnap.data();
          const updates: any = {};
          if (!data.uid) updates.uid = currentUser.uid;
          if (!data.email) updates.email = currentUser.email || `${currentUser.uid}@anonymous.com`;
          if (!data.name) updates.name = currentUser.displayName || 'Usuário Anônimo';
          if (!data.avatar) updates.avatar = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'U')}&background=random`;
          if (!data.level) updates.level = 'Iniciante';
          if (typeof data.points !== 'number') updates.points = 0;
          if (data.role !== 'user' && data.role !== 'admin') updates.role = 'user';
          if (!data.createdAt) updates.createdAt = serverTimestamp();
          if (data.termsAccepted === undefined) updates.termsAccepted = false;
          
          if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
          }
        }
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        } catch (e) {
          console.error("Error in auth state change:", e);
        }
      }
            
      // Se estivermos em um popup de login e o login foi bem sucedido, fecha o popup
      if (currentUser && window.opener) {
        window.close();
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  // DEBUG: console.log('Auth State:', user);
  return (
    <AuthContext.Provider value={{ user, loading, termsAccepted, role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

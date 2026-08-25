import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync user profile in background
        (async () => {
          try {
            const userRef = doc(db, 'users', currentUser.uid);
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
        })();
      }
      
      // Se estivermos em um popup de login e o login foi bem sucedido, fecha o popup
      if (currentUser && window.opener) {
        window.close();
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

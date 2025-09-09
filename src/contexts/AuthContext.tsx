import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, COLLECTIONS } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Crea automáticamente el documento del usuario en Firestore
   */
  const createUserDocument = async (user: User) => {
    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      
      await setDoc(userDocRef, {
        email: user.email,
        name: user.email?.split('@')[0] || 'Nutricionista',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true }); // merge: true evita sobrescribir si ya existe
      
      console.log('Documento de usuario creado/actualizado en Firestore');
    } catch (error) {
      console.error('Error creando documento de usuario:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El documento del usuario se creará automáticamente en useEffect
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error durante logout:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario autenticado - crear documento en Firestore
        await createUserDocument(user);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

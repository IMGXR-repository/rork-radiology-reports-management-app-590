import { useState, useCallback, useMemo, useEffect } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { User, SharedItem, ShareRequest, RegistrationData } from '@/types';
import { auth, db } from '@/config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc
} from 'firebase/firestore';

// Generate a static QR code for user sync
const generateUserSyncCode = (userId: string): string => {
  return `radia-sync-${userId}-${Date.now()}`;
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showQRSyncModal, setShowQRSyncModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userSyncCode, setUserSyncCode] = useState<string>(() => {
    return generateUserSyncCode('temp-' + Date.now());
  });

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      if (Platform.OS === 'web') {
        localStorage.removeItem('user');
        localStorage.removeItem('sharedItems');
      } else {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.multiRemove(['user', 'sharedItems']);
      }
      setUser(null);
      setSharedItems([]);
      setIsAuthenticated(false);
      setShowPinModal(false);
      setShowQRSyncModal(false);
      setShowLoginModal(true);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const loadUserFromFirestore = useCallback(async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
        
        const syncCode = generateUserSyncCode(userData.id);
        setUserSyncCode(syncCode);
        
        if (userData.isRegistered) {
          setShowPinModal(true);
        } else {
          if (Platform.OS === 'web') {
            setShowQRSyncModal(true);
          } else {
            setIsAuthenticated(true);
          }
        }
        
        if (Platform.OS === 'web') {
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          const AsyncStorage = await import('@react-native-async-storage/async-storage');
          await AsyncStorage.default.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Error loading user from Firestore:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserFromFirestore(firebaseUser.uid);
      } else {
        setShowLoginModal(true);
      }
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [loadUserFromFirestore]);

  const signIn = useCallback(async () => {
    setShowLoginModal(true);
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await loadUserFromFirestore(userCredential.user.uid);
      setShowLoginModal(false);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }, [loadUserFromFirestore]);

  const handleRegister = useCallback(async (data: RegistrationData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      const newUser: User = {
        id: userCredential.user.uid,
        email: data.email,
        name: data.name,
        dni: data.dni,
        country: data.country,
        city: data.city,
        medicalLicense: data.medicalLicense,
        medicalSpecialty: data.medicalSpecialty,
        pin: data.pin,
        createdAt: new Date().toISOString(),
        isRegistered: true,
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      
      setUser(newUser);
      setShowLoginModal(false);
      
      const syncCode = generateUserSyncCode(newUser.id);
      setUserSyncCode(syncCode);
      
      if (Platform.OS === 'web') {
        setShowQRSyncModal(true);
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        setIsAuthenticated(true);
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.setItem('user', JSON.stringify(newUser));
      }
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }, []);

  const handlePinSuccess = useCallback(() => {
    setShowPinModal(false);
    // Show QR sync modal for web users after PIN
    if (Platform.OS === 'web') {
      setShowQRSyncModal(true);
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePinClose = useCallback(() => {
    setShowPinModal(false);
    setShowQRSyncModal(false);
    // If user closes PIN modal, sign them out
    signOut();
  }, [signOut]);

  const handleQRSyncClose = useCallback(() => {
    setShowQRSyncModal(false);
    setIsAuthenticated(true);
  }, []);

  const shareItem = useCallback(async (shareRequest: ShareRequest): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const newSharedItem: SharedItem = {
        id: Date.now().toString(),
        type: shareRequest.itemType,
        itemId: shareRequest.itemId,
        sharedBy: user.id,
        sharedWith: shareRequest.recipientEmail,
        sharedAt: new Date().toISOString(),
        message: shareRequest.message,
      };
      
      await addDoc(collection(db, 'sharedItems'), newSharedItem);
      
      const updatedSharedItems = [...sharedItems, newSharedItem];
      setSharedItems(updatedSharedItems);
      
      if (Platform.OS === 'web') {
        localStorage.setItem('sharedItems', JSON.stringify(updatedSharedItems));
      } else {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.setItem('sharedItems', JSON.stringify(updatedSharedItems));
      }
      
      console.log(`Item compartido: ${shareRequest.itemType} con ${shareRequest.recipientEmail}`);
      return true;
    } catch (error) {
      console.error('Error sharing item:', error);
      return false;
    }
  }, [user, sharedItems]);

  const getSharedItemsReceived = useCallback(() => {
    if (!user) return [];
    return sharedItems.filter(item => item.sharedWith === user.email);
  }, [user, sharedItems]);

  const getSharedItemsSent = useCallback(() => {
    if (!user) return [];
    return sharedItems.filter(item => item.sharedBy === user.id);
  }, [user, sharedItems]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent');
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      if (Platform.OS === 'web') {
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (!userDoc.exists()) {
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            dni: '',
            country: '',
            city: '',
            medicalLicense: '',
            medicalSpecialty: '',
            pin: '',
            createdAt: new Date().toISOString(),
            isRegistered: false,
          };
          
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
          
          const syncCode = generateUserSyncCode(newUser.id);
          setUserSyncCode(syncCode);
          
          if (Platform.OS === 'web') {
            setShowQRSyncModal(true);
            localStorage.setItem('user', JSON.stringify(newUser));
          } else {
            setIsAuthenticated(true);
          }
        } else {
          await loadUserFromFirestore(firebaseUser.uid);
        }
        
        setShowLoginModal(false);
      } else {
        throw new Error('Google Sign-In solo está disponible en web');
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Inicio de sesión cancelado');
      }
      throw error;
    }
  }, [loadUserFromFirestore]);

  const handleAppleSignIn = useCallback(async () => {
    throw new Error('Apple Sign-In no está implementado aún');
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    userSyncCode,
    signIn,
    signOut,
    shareItem,
    sharedItems,
    getSharedItemsReceived,
    getSharedItemsSent,
    showLoginModal,
    setShowLoginModal,
    showPinModal,
    setShowPinModal,
    showQRSyncModal,
    setShowQRSyncModal,
    handleLogin,
    handleRegister,
    handlePinSuccess,
    handlePinClose,
    handleQRSyncClose,
    resetPassword,
    handleGoogleSignIn,
    handleAppleSignIn,
  }), [user, isLoading, isAuthenticated, userSyncCode, signIn, signOut, shareItem, sharedItems, getSharedItemsReceived, getSharedItemsSent, showLoginModal, showPinModal, showQRSyncModal, handleLogin, handleRegister, handlePinSuccess, handlePinClose, handleQRSyncClose, resetPassword, handleGoogleSignIn, handleAppleSignIn]);
});
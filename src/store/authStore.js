'use client';

import { create } from 'zustand';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  collection,
  serverTimestamp
} from 'firebase/firestore';
import { toast } from 'react-toastify';

const ADMIN_EMAILS = ['ogasolomon63@gmail.com', 'boyijoshua72@gmail.com'];

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  pendingUsers: [],

  // Handle Google Sign In
  loginWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const isAdmin = ADMIN_EMAILS.includes(result.user.email);
      
      // Get existing user data or create new
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      console.log('User snapshot:', userSnap.exists(), userSnap.data());
      
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        role: isAdmin ? 'admin' : 'user',
        isApproved: isAdmin ? true : userSnap.exists() ? userSnap.data().isApproved : false,
        lastLoginAt: serverTimestamp(),
        createdAt: userSnap.exists() ? userSnap.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save user data
      await setDoc(userRef, userData, { merge: true });

      // If user is not approved and not admin, show message and sign out
      if (!isAdmin && !userData.isApproved) {
        toast.info('Your account is pending approval from an administrator.');
        await signOut(auth);
        set({ user: null });
        return;
      }

      set({ user: userData });
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login: ' + error.message);
    }
  },

  // Handle Sign Out
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null });
      toast.success('Successfully logged out!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout: ' + error.message);
    }
  },

  // Initialize Auth State
  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            set({ 
              user: { ...userData },
              loading: false 
            });
          } else {
            set({ user: null, loading: false });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          set({ user: null, loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
    });

    return unsubscribe;
  },

  // Fetch Pending Users
  fetchPendingUsers: async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('isApproved', '==', false),
        where('role', '==', 'user')
      );
      
      const snapshot = await getDocs(q);
      const pendingUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      set({ pendingUsers });
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to fetch pending users');
    }
  },

  // Approve User
  approveUser: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        isApproved: true,
        approvedAt: serverTimestamp(),
        approvedBy: get().user?.email
      }, { merge: true });

      await get().fetchPendingUsers();
      toast.success('User approved successfully');
      return true;
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
      return false;
    }
  }
}));

// Initialize auth listener when the store is created
if (typeof window !== 'undefined') {
  useAuthStore.getState().initializeAuth();
}

export default useAuthStore;

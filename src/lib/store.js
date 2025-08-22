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
  enableNetwork,
  disableNetwork,
  waitForPendingWrites
} from 'firebase/firestore';
import { toast } from 'react-toastify';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  isOnline: true,
  retryAttempts: 0,
  
  setOnlineStatus: (isOnline) => {
    set({ isOnline });
    if (isOnline) {
      toast.success('Back online!');
    } else {
      toast.warning('You are offline. Changes will be saved when connection is restored.');
    }
  },

  loginWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if email is in admin list
      const adminEmails = ['ogasolomon63@gmail.com', 'boyijoshua72@gmail.com'];
      const role = adminEmails.includes(result.user.email) ? 'admin' : 'user';
      
      // Save user role in Firestore with retry logic
      const saveUserRole = async (attempts = 0) => {
        try {
          await setDoc(doc(db, 'users', result.user.uid), {
            email: result.user.email,
            role: role
          });
          toast.success('Successfully logged in!');
        } catch (error) {
          if (attempts < 3) {
            // Retry after 1 second
            setTimeout(() => saveUserRole(attempts + 1), 1000);
          } else {
            // Store locally if all retries fail
            localStorage.setItem('pendingUserRole', JSON.stringify({
              uid: result.user.uid,
              email: result.user.email,
              role: role
            }));
            toast.warning('Login successful but some data will sync when online');
          }
        }
      };

      await saveUserRole();
    } catch (error) {
      toast.error('Failed to login: ' + error.message);
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null });
      toast.success('Successfully logged out!');
    } catch (error) {
      toast.error('Failed to logout: ' + error.message);
    }
  },

  retryConnection: async () => {
    try {
      await enableNetwork(db);
      set({ isOnline: true });
      
      // Wait for any pending writes to be synchronized
      await waitForPendingWrites(db);
      
      // Try to sync any pending data
      const pendingUserRole = localStorage.getItem('pendingUserRole');
      if (pendingUserRole) {
        const { uid, email, role } = JSON.parse(pendingUserRole);
        await setDoc(doc(db, 'users', uid), { email, role });
        localStorage.removeItem('pendingUserRole');
      }
      
      toast.success('Connection restored!');
    } catch (error) {
      set({ isOnline: false });
      toast.error('Could not connect to the server. Please check your connection.');
    }
  },

  initializeAuth: () => {
    // Setup network status monitoring
    if (typeof window !== 'undefined') {
      window.addEventListener('online', get().retryConnection);
      window.addEventListener('offline', () => {
        disableNetwork(db);
        set({ isOnline: false });
        toast.warning('You are offline. Changes will be saved when connection is restored.');
      });
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user role from Firestore
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          const userData = docSnap.data();
          
          set({
            user: {
              ...user,
              role: userData?.role || 'user'
            }
          });
        } catch (error) {
          // If offline, check for pending data
          const pendingUserRole = localStorage.getItem('pendingUserRole');
          if (pendingUserRole) {
            const { role } = JSON.parse(pendingUserRole);
            set({
              user: {
                ...user,
                role: role
              }
            });
          } else {
            set({
              user: {
                ...user,
                role: 'user' // Default to user role when offline
              }
            });
          }
          console.error('Error fetching user role:', error);
        }
      } else {
        set({ user: null });
      }
      set({ loading: false });
    });

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', get().retryConnection);
        window.removeEventListener('offline', () => set({ isOnline: false }));
      }
    };
  }
}));

export default useAuthStore;

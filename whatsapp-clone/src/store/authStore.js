import { create } from 'zustand';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  initAuth: () => {
    const user = localStorage.getItem('user');
    if (user) {
      set({ user: JSON.parse(user), isAuthenticated: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      };
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, loading: false });
      return user;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  register: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName || email.split('@')[0],
      };
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, loading: false });
      return user;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));

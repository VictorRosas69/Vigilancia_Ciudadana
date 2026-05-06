import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isGuest: false,
      isLoading: false,

      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === 'admin',

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isGuest: false });
      },

      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }));
      },

      enterAsGuest: () => set({ isGuest: true }),

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isGuest: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isGuest: state.isGuest }),
    }
  )
);

export default useAuthStore;
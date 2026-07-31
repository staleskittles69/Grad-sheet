import { create } from 'zustand'
import type { User } from '../types/auth'
import { getMe, logout as logoutApi } from '../api/auth'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  initialize: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),

  initialize: async () => {
    set({ loading: true })
    try {
      const user = await getMe()
      set({ user, initialized: true })
    } catch {
      set({ user: null, initialized: true })
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    await logoutApi()
    set({ user: null })
  },
}))

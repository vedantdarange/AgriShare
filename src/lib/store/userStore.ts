import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

export interface Profile {
    id: string
    full_name: string | null
    phone: string | null
    avatar_url: string | null
    role: 'buyer' | 'seller' | 'both' | 'admin'
    bio: string | null
    village: string | null
    district: string | null
    state: string | null
    pincode: string | null
    verified_farmer: boolean
    is_verified?: boolean // Alias for compatibility
    created_at: string
    updated_at: string
}

interface UserStore {
    user: User | null
    profile: Profile | null
    isLoading: boolean
    activeMode: 'buyer' | 'seller'
    setUser: (user: User | null) => void
    setProfile: (profile: Profile | null) => void
    setLoading: (loading: boolean) => void
    setActiveMode: (mode: 'buyer' | 'seller') => void
    clear: () => void
}

export const useUserStore = create<UserStore>()(
    (set) => ({
        user: null,
        profile: null,
        isLoading: true, // Start as true to signify session check in progress
        activeMode: 'buyer',
        setUser: (user) => set({ user }),
        setProfile: (profile) => set({ profile }),
        setLoading: (loading) => set({ isLoading: loading }),
        setActiveMode: (mode) => set({ activeMode: mode }),
        clear: () => set({ user: null, profile: null, activeMode: 'buyer', isLoading: false }),
    })
)

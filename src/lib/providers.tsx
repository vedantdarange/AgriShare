'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { useCartStore } from '@/lib/store/cartStore'
import { useUserStore } from '@/lib/store/userStore'
import { supabase } from '@/lib/supabase/client'
import { Toaster } from 'sonner'

function CartHydrator() {
    const hydrated = useRef(false)
    useEffect(() => {
        if (!hydrated.current) {
            useCartStore.persist.rehydrate()
            hydrated.current = true
        }
    }, [])
    return null
}

function AuthSyncer({ children }: { children: React.ReactNode }) {
    const { setUser, setProfile, setLoading, clear } = useUserStore()
    const [mounted, setMounted] = useState(false)
    const initialized = useRef(false)

    useEffect(() => {
        setMounted(true)

        async function fetchProfile(userId: string) {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single()
                if (profile) setProfile(profile)
            } catch (err) {
                console.warn('Profile fetch error:', err)
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const user = session?.user ?? null

                if (user) {
                    setUser(user)
                    // Fetch profile in background
                    fetchProfile(user.id)
                } else {
                    clear()
                }

                // Any event (including INITIAL_SESSION) should resolve loading
                if (!initialized.current) {
                    initialized.current = true
                    setLoading(false)
                }
            }
        )

        // Double check session in case onAuthStateChange is slow or misses INITIAL_SESSION
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!initialized.current) {
                const user = session?.user ?? null
                if (user) {
                    setUser(user)
                    fetchProfile(user.id)
                }
                initialized.current = true
                setLoading(false)
            }
        }).catch(err => {
            console.error('Session check error:', err)
            if (!initialized.current) {
                initialized.current = true
                setLoading(false)
            }
        })

        // Final safety fallback
        const timer = setTimeout(() => {
            if (!initialized.current) {
                console.warn('Auth initialization timed out after 4s')
                initialized.current = true
                setLoading(false)
            }
        }, 4000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timer)
        }
    }, [setUser, setProfile, setLoading, clear])

    if (!mounted) return null

    return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            <CartHydrator />
            <AuthSyncer>
                {children}
            </AuthSyncer>
            <Toaster
                position="top-right"
                expand={false}
                richColors={false}
                gap={10}
                toastOptions={{
                    duration: 4000,
                    style: {
                        fontFamily: 'inherit',
                        borderRadius: '14px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
                        maxWidth: '380px',
                        background: '#ffffff',
                        border: '1px solid #e7e5e4',
                        color: '#1c1917',
                        padding: '14px 16px',
                    },
                    classNames: {
                        toast: 'toast-item',
                    },
                }}
            />
        </QueryClientProvider>
    )
}

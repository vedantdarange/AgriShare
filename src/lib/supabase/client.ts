import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                // Bypass Next.js fetch interceptor hanging bug on soft navigations
                // while ensuring proper context and error handling
                fetch: async (url, options) => {
                    try {
                        const fetchTarget = typeof window !== 'undefined' ? window.fetch : globalThis.fetch;
                        return await fetchTarget(url, options);
                    } catch (error) {
                        console.warn('Supabase fetch bypassed network error:', error);
                        // Return a mocked failed response so Supabase's retry logic handles it
                        // gracefully (as a 502) without triggering an unhandled exception overlay
                        return new Response(JSON.stringify({ error: 'network_timeout' }), {
                            status: 502,
                            headers: { 'Content-Type': 'application/json' },
                        });
                    }
                },
            }
        }
    )
}

// Singleton for use in client components
export const supabase = createClient()

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // During build, if env vars are missing, we can return null or throw a helpful error
        // throwing helps identify the issue in build logs
        if (typeof window === 'undefined') {
            // Avoid crashing build if it's just a static generation check, but usually we need this.
            // However, for client components, strict check is good.
        }
        // Throw a clear error to help debug build issues
        throw new Error("Missing Supabase Environment Variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

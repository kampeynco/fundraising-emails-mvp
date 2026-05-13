import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://npxklgkoemybgivdrmka.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
    console.warn(
        'Missing Supabase environment variable. Add VITE_SUPABASE_ANON_KEY to your .env file.'
    )
}

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
        },
    }
)

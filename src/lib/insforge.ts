import { createClient } from '@insforge/sdk'

const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY

if (!baseUrl || !anonKey) {
    console.warn(
        'Missing InsForge environment variables. Add VITE_INSFORGE_BASE_URL and VITE_INSFORGE_ANON_KEY to your .env file.'
    )
}

export const insforge = createClient({
    baseUrl: baseUrl || 'https://placeholder.insforge.app',
    anonKey: anonKey || 'placeholder-key',
})

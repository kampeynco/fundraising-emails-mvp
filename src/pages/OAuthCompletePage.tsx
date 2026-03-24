import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function OAuthCompletePage() {
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const provider = searchParams.get('provider')
        const error = searchParams.get('error')

        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage(
                    { type: 'oauth_complete', provider, error },
                    window.location.origin
                )
            } catch {
                // opener inaccessible — fall through to redirect
            }
            window.close()
        } else {
            // Fallback: main window was used instead of popup
            const base = '/dashboard/settings?section=integrations'
            if (provider) {
                window.location.replace(`${base}&connected=${provider}`)
            } else if (error) {
                window.location.replace(`${base}&error=${error}`)
            } else {
                window.location.replace(base)
            }
        }
    }, [searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#111827]">
            <p className="text-sm text-white/40">Completing connection…</p>
        </div>
    )
}

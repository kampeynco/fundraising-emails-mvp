import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function OAuthCompletePage() {
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const provider = searchParams.get('provider')
        const error = searchParams.get('error')

        // Primary: BroadcastChannel works same-origin regardless of window.opener
        const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined'

        if (hasBroadcastChannel) {
            const bc = new BroadcastChannel('oauth_complete')
            bc.postMessage({ type: 'oauth_complete', provider, error })
            bc.close()
            window.close()
            return
        }

        // Fallback for browsers without BroadcastChannel: try window.opener
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage(
                    { type: 'oauth_complete', provider, error },
                    window.location.origin
                )
                window.close()
                return
            } catch {
                // opener inaccessible — fall through
            }
        }

        // Last resort: redirect within this window to the settings page
        const base = '/dashboard/settings?section=integrations'
        if (provider) {
            window.location.replace(`${base}&connected=${provider}`)
        } else if (error) {
            window.location.replace(`${base}&error=${error}`)
        } else {
            window.location.replace(base)
        }
    }, [searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#111827]">
            <p className="text-sm text-white/40">Completing connection…</p>
        </div>
    )
}

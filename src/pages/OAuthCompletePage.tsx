import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function OAuthCompletePage() {
    const [searchParams] = useSearchParams()
    const [closeFailed, setCloseFailed] = useState(false)

    useEffect(() => {
        const provider = searchParams.get('provider')
        const error = searchParams.get('error')

        // Primary: localStorage storage event fires in all OTHER same-origin windows instantly
        // (window.opener is null after cross-origin nav; BroadcastChannel may be blocked by some browsers)
        localStorage.setItem('oauth_result', JSON.stringify({
            type: 'oauth_complete',
            provider,
            error,
            ts: Date.now(),
        }))
        // Clean up after 30s in case main window never read it
        setTimeout(() => localStorage.removeItem('oauth_result'), 30_000)

        // Also try BroadcastChannel as secondary channel
        try {
            const bc = new BroadcastChannel('oauth_complete')
            bc.postMessage({ type: 'oauth_complete', provider, error })
            bc.close()
        } catch {
            // BroadcastChannel not supported — localStorage event is enough
        }

        // Try to close the popup
        window.close()

        // If still open (Chrome blocks close after cross-origin navigation),
        // show a manual close message after a short delay
        const timer = setTimeout(() => setCloseFailed(true), 400)
        return () => clearTimeout(timer)
    }, [searchParams])

    const provider = searchParams.get('provider')
    const error = searchParams.get('error')

    if (!closeFailed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#111827]">
                <p className="text-sm text-white/40">Completing connection…</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#111827]">
            <div className="text-center space-y-3">
                {error ? (
                    <p className="text-sm text-red-400">Connection failed. You can close this window.</p>
                ) : (
                    <p className="text-sm text-green-400">
                        {provider ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} connected!` : 'Connected!'} You can close this window.
                    </p>
                )}
                <button
                    onClick={() => window.close()}
                    className="text-xs text-white/40 underline hover:text-white/60"
                >
                    Close this window
                </button>
            </div>
        </div>
    )
}

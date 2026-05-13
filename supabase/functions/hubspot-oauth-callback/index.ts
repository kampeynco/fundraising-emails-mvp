import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

function htmlRedirect(url: string): Response {
    return new Response(
        `<!DOCTYPE html><html><head><title>Redirecting...</title></head><body><script>window.location.replace(${JSON.stringify(url)});</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
}

Deno.serve(async (req: Request): Promise<Response> => {
    const reqUrl = new URL(req.url)
    const code = reqUrl.searchParams.get('code')
    const state = reqUrl.searchParams.get('state')

    const appUrl = Deno.env.get('APP_URL') || ''
    const completeUrl = `${appUrl}/oauth-complete`

    if (!code) {
        return htmlRedirect(`${completeUrl}?error=oauth_failed`)
    }

    const clientId = Deno.env.get('HUBSPOT_CLIENT_ID')
    const clientSecret = Deno.env.get('HUBSPOT_CLIENT_SECRET')
    const redirectUri = Deno.env.get('HUBSPOT_REDIRECT_URI')

    if (!clientId || !clientSecret || !redirectUri) {
        return htmlRedirect(`${completeUrl}?error=not_configured`)
    }

    try {
        // Decode state to recover the user's JWT
        const userToken = state ? atob(decodeURIComponent(state)) : null
        if (!userToken) {
            return htmlRedirect(`${completeUrl}?error=invalid_state`)
        }

        // Exchange authorization code for tokens
        const tokenRes = await fetch('https://api.hubspot.com/oauth/v1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code,
            }),
        })

        if (!tokenRes.ok) {
            console.error('HubSpot token exchange failed:', await tokenRes.text())
            return htmlRedirect(`${completeUrl}?error=token_exchange_failed`)
        }

        const tokenData = await tokenRes.json()
        const accessToken = tokenData.access_token
        const refreshToken = tokenData.refresh_token

        // Fetch account info
        const accountRes = await fetch(`https://api.hubspot.com/oauth/v1/access-tokens/${accessToken}`)
        const accountData = await accountRes.json()

        // Extract user_id directly from JWT payload (no server round-trip needed)
        const jwtParts = userToken.split('.')
        if (jwtParts.length !== 3) {
            console.error('Invalid JWT structure in state')
            return htmlRedirect(`${completeUrl}?error=invalid_state`)
        }
        let userId: string | null = null
        try {
            const payload = JSON.parse(atob(jwtParts[1].replace(/-/g, '+').replace(/_/g, '/')))
            userId = payload.sub || null
        } catch {
            console.error('Failed to decode JWT payload')
            return htmlRedirect(`${completeUrl}?error=invalid_state`)
        }
        if (!userId) {
            console.error('No user id (sub) in JWT payload')
            return htmlRedirect(`${completeUrl}?error=auth_failed`)
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://npxklgkoemybgivdrmka.supabase.co'
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!serviceRoleKey) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
            return htmlRedirect(`${completeUrl}?error=callback_failed`)
        }

        const client = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        })

        const { error: upsertError } = await client.from('email_integrations').upsert(
            {
                user_id: userId,
                provider: 'hubspot',
                access_token: accessToken,
                refresh_token: refreshToken,
                metadata: {
                    account_name: accountData.hub_domain || accountData.hub_id?.toString() || 'HubSpot',
                    hub_id: accountData.hub_id?.toString() || '',
                },
                connected_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,provider' }
        )

        if (upsertError) {
            console.error('HubSpot integration upsert failed:', upsertError)
            return htmlRedirect(`${completeUrl}?error=callback_failed`)
        }

        return htmlRedirect(`${completeUrl}?provider=hubspot`)
    } catch (err) {
        console.error('HubSpot OAuth callback error:', err)
        return htmlRedirect(`${completeUrl}?error=callback_failed`)
    }
})

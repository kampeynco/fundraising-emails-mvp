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

    const clientId = Deno.env.get('MAILCHIMP_CLIENT_ID')
    const clientSecret = Deno.env.get('MAILCHIMP_CLIENT_SECRET')
    const redirectUri = Deno.env.get('MAILCHIMP_REDIRECT_URI')

    if (!clientId || !clientSecret || !redirectUri) {
        return htmlRedirect(`${completeUrl}?error=not_configured`)
    }

    try {
        // Decode state to recover the user's JWT
        const userToken = state ? atob(decodeURIComponent(state)) : null
        if (!userToken) {
            return htmlRedirect(`${completeUrl}?error=invalid_state`)
        }

        // Exchange authorization code for access token
        const tokenRes = await fetch('https://login.mailchimp.com/oauth2/token', {
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
            const body = await tokenRes.text()
            console.error('Mailchimp token exchange HTTP error', tokenRes.status, body)
            // Include status so we can distinguish redirect_uri mismatch (400) vs bad credentials (401)
            return htmlRedirect(`${completeUrl}?error=mc_token_http_${tokenRes.status}`)
        }

        const tokenData = await tokenRes.json()
        const accessToken = tokenData.access_token

        if (!accessToken) {
            console.error('Mailchimp token exchange: no access_token in response', JSON.stringify(tokenData))
            return htmlRedirect(`${completeUrl}?error=mc_token_missing`)
        }

        // Fetch server prefix (data center, e.g. "us21")
        const metaRes = await fetch('https://login.mailchimp.com/oauth2/metadata', {
            headers: { Authorization: `OAuth ${accessToken}` },
        })

        if (!metaRes.ok) {
            const body = await metaRes.text()
            console.error('Mailchimp metadata fetch failed', metaRes.status, body)
            return htmlRedirect(`${completeUrl}?error=mc_metadata_error`)
        }

        const metaData = await metaRes.json()
        const serverPrefix = metaData.dc

        if (!serverPrefix) {
            console.error('Mailchimp metadata missing dc field:', JSON.stringify(metaData))
            return htmlRedirect(`${completeUrl}?error=mc_no_datacenter`)
        }

        // Fetch first audience list (non-fatal — proceed without it if it fails)
        let firstList: { id: string; name: string } | null = null
        try {
            const listsRes = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/lists?count=1`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            const listsData = await listsRes.json()
            firstList = listsData?.lists?.[0] ?? null
        } catch (listsErr) {
            console.error('Mailchimp lists fetch failed (non-fatal):', listsErr)
        }

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
            return htmlRedirect(`${completeUrl}?error=mc_db_write_failed`)
        }

        const client = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        })

        const { error: upsertError } = await client.from('email_integrations').upsert(
            {
                user_id: userId,
                provider: 'mailchimp',
                access_token: accessToken,
                server_prefix: serverPrefix,
                list_id: firstList?.id || null,
                metadata: {
                    account_name: metaData.accountname || metaData.login?.email || '',
                    login_email: metaData.login?.email || '',
                    list_name: firstList?.name || '',
                },
                connected_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,provider' }
        )

        if (upsertError) {
            console.error('Mailchimp integration upsert failed:', upsertError)
            return htmlRedirect(`${completeUrl}?error=mc_db_write_failed`)
        }

        return htmlRedirect(`${completeUrl}?provider=mailchimp`)
    } catch (err) {
        console.error('Mailchimp OAuth callback error:', err)
        return htmlRedirect(`${completeUrl}?error=callback_failed`)
    }
})

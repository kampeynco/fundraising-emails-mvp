import { createClient } from 'npm:@insforge/sdk'

function htmlRedirect(url: string): Response {
    return new Response(
        `<!DOCTYPE html><html><head><title>Redirecting...</title></head><body><script>window.location.replace(${JSON.stringify(url)});</script></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
}

export default async function (req: Request): Promise<Response> {
    const reqUrl = new URL(req.url)
    const code = reqUrl.searchParams.get('code')
    const state = reqUrl.searchParams.get('state')

    const appUrl = Deno.env.get('APP_URL') || ''
    const settingsUrl = `${appUrl}/dashboard/settings?section=integrations`

    if (!code) {
        return htmlRedirect(`${settingsUrl}&error=oauth_failed`)
    }

    const clientId = Deno.env.get('MAILCHIMP_CLIENT_ID')
    const clientSecret = Deno.env.get('MAILCHIMP_CLIENT_SECRET')
    const redirectUri = Deno.env.get('MAILCHIMP_REDIRECT_URI')

    if (!clientId || !clientSecret || !redirectUri) {
        return htmlRedirect(`${settingsUrl}&error=not_configured`)
    }

    try {
        // Decode state to recover the user's JWT
        const userToken = state ? atob(decodeURIComponent(state)) : null
        if (!userToken) {
            return htmlRedirect(`${settingsUrl}&error=invalid_state`)
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
            console.error('Mailchimp token exchange failed:', await tokenRes.text())
            return htmlRedirect(`${settingsUrl}&error=token_exchange_failed`)
        }

        const tokenData = await tokenRes.json()
        const accessToken = tokenData.access_token

        // Fetch server prefix (data center, e.g. "us21")
        const metaRes = await fetch('https://login.mailchimp.com/oauth2/metadata', {
            headers: { Authorization: `OAuth ${accessToken}` },
        })
        const metaData = await metaRes.json()
        const serverPrefix = metaData.dc

        // Fetch first audience list
        const listsRes = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/lists?count=1`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listsData = await listsRes.json()
        const firstList = listsData?.lists?.[0]

        // Extract user_id directly from JWT payload (no server round-trip needed)
        const jwtParts = userToken.split('.')
        if (jwtParts.length !== 3) {
            console.error('Invalid JWT structure in state')
            return htmlRedirect(`${settingsUrl}&error=invalid_state`)
        }
        let userId: string | null = null
        try {
            const payload = JSON.parse(atob(jwtParts[1].replace(/-/g, '+').replace(/_/g, '/')))
            userId = payload.sub || null
        } catch {
            console.error('Failed to decode JWT payload')
            return htmlRedirect(`${settingsUrl}&error=invalid_state`)
        }
        if (!userId) {
            console.error('No user id (sub) in JWT payload')
            return htmlRedirect(`${settingsUrl}&error=auth_failed`)
        }

        // Write integration using API_KEY (admin) — no RLS, direct write
        const client = createClient({
            baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
            anonKey: Deno.env.get('API_KEY'),
        })

        const { error: upsertError } = await client.database.from('email_integrations').upsert(
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
            return htmlRedirect(`${settingsUrl}&error=callback_failed`)
        }

        return htmlRedirect(`${settingsUrl}&connected=mailchimp`)
    } catch (err) {
        console.error('Mailchimp OAuth callback error:', err)
        return htmlRedirect(`${settingsUrl}&error=callback_failed`)
    }
}

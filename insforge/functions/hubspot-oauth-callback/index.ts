import { createClient } from 'npm:@insforge/sdk'

export default async function (req: Request): Promise<Response> {
    const reqUrl = new URL(req.url)
    const code = reqUrl.searchParams.get('code')
    const state = reqUrl.searchParams.get('state')

    const appUrl = Deno.env.get('APP_URL') || ''
    const settingsUrl = `${appUrl}/dashboard/settings?section=integrations`

    if (!code) {
        return Response.redirect(`${settingsUrl}?error=oauth_failed`, 302)
    }

    const clientId = Deno.env.get('HUBSPOT_CLIENT_ID')
    const clientSecret = Deno.env.get('HUBSPOT_CLIENT_SECRET')
    const redirectUri = Deno.env.get('HUBSPOT_REDIRECT_URI')

    if (!clientId || !clientSecret || !redirectUri) {
        return Response.redirect(`${settingsUrl}?error=not_configured`, 302)
    }

    try {
        // Decode state to recover the user's JWT
        const userToken = state ? atob(decodeURIComponent(state)) : null
        if (!userToken) {
            return Response.redirect(`${settingsUrl}?error=invalid_state`, 302)
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
            return Response.redirect(`${settingsUrl}?error=token_exchange_failed`, 302)
        }

        const tokenData = await tokenRes.json()
        const accessToken = tokenData.access_token
        const refreshToken = tokenData.refresh_token

        // Fetch account info
        const accountRes = await fetch(`https://api.hubspot.com/oauth/v1/access-tokens/${accessToken}`)
        const accountData = await accountRes.json()

        // Authenticate as the user and save integration
        const client = createClient({
            baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
            edgeFunctionToken: userToken,
        })

        const { data: userData } = await client.auth.getCurrentUser()
        if (!userData?.user?.id) {
            return Response.redirect(`${settingsUrl}?error=auth_failed`, 302)
        }

        await client.database.from('email_integrations').upsert(
            {
                user_id: userData.user.id,
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

        return Response.redirect(`${settingsUrl}?connected=hubspot`, 302)
    } catch (err) {
        console.error('HubSpot OAuth callback error:', err)
        return Response.redirect(`${settingsUrl}?error=callback_failed`, 302)
    }
}

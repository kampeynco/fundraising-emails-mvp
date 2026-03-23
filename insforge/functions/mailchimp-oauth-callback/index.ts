import { createClient } from 'npm:@insforge/sdk'

export default async function (req: Request): Promise<Response> {
    const reqUrl = new URL(req.url)
    const code = reqUrl.searchParams.get('code')
    const state = reqUrl.searchParams.get('state')

    const appUrl = Deno.env.get('APP_URL') || ''
    const settingsUrl = `${appUrl}/dashboard/settings?section=integrations`

    if (!code) {
        return Response.redirect(`${settingsUrl}&error=oauth_failed`, 302)
    }

    const clientId = Deno.env.get('MAILCHIMP_CLIENT_ID')
    const clientSecret = Deno.env.get('MAILCHIMP_CLIENT_SECRET')
    const redirectUri = Deno.env.get('MAILCHIMP_REDIRECT_URI')

    if (!clientId || !clientSecret || !redirectUri) {
        return Response.redirect(`${settingsUrl}&error=not_configured`, 302)
    }

    try {
        // Decode state to recover the user's JWT
        const userToken = state ? atob(decodeURIComponent(state)) : null
        if (!userToken) {
            return Response.redirect(`${settingsUrl}&error=invalid_state`, 302)
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
            return Response.redirect(`${settingsUrl}&error=token_exchange_failed`, 302)
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

        // Authenticate as the user and save integration
        const client = createClient({
            baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
            edgeFunctionToken: userToken,
        })

        const { data: userData } = await client.auth.getCurrentUser()
        if (!userData?.user?.id) {
            return Response.redirect(`${settingsUrl}&error=auth_failed`, 302)
        }

        await client.database.from('email_integrations').upsert(
            {
                user_id: userData.user.id,
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

        return Response.redirect(`${settingsUrl}&connected=mailchimp`, 302)
    } catch (err) {
        console.error('Mailchimp OAuth callback error:', err)
        return Response.redirect(`${settingsUrl}&error=callback_failed`, 302)
    }
}

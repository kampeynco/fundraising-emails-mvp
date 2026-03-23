const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function (req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders })
    }

    const clientId = Deno.env.get('HUBSPOT_CLIENT_ID')
    const redirectUri = Deno.env.get('HUBSPOT_REDIRECT_URI')

    if (!clientId || !redirectUri) {
        return new Response(
            JSON.stringify({ error: 'HubSpot OAuth not configured. Set HUBSPOT_CLIENT_ID and HUBSPOT_REDIRECT_URI secrets.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Encode the user's auth token as state so the callback can identify the user
    const authHeader = req.headers.get('Authorization')
    const userToken = authHeader ? authHeader.replace('Bearer ', '') : ''
    const state = btoa(userToken)

    const scopes = encodeURIComponent('crm.objects.contacts.read sales-email-read')
    const url =
        `https://app.hubspot.com/oauth/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scopes}` +
        `&state=${encodeURIComponent(state)}`

    return new Response(JSON.stringify({ url }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}

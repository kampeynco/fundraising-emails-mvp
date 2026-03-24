import { createClient } from 'npm:@insforge/sdk'

export default async function (req: Request): Promise<Response> {
    const internalUrl = Deno.env.get('INSFORGE_INTERNAL_URL') || ''
    const anonKey = Deno.env.get('ANON_KEY') || ''
    const apiKey = Deno.env.get('API_KEY') || ''

    const authHeader = req.headers.get('Authorization')
    const rawToken = authHeader ? authHeader.replace('Bearer ', '') : null

    const results: Record<string, unknown> = {
        internalUrl,
        hasAnonKey: !!anonKey,
        hasApiKey: !!apiKey,
        hasRawToken: !!rawToken,
    }

    // Test 1: Decode JWT locally to get user_id
    if (rawToken) {
        try {
            const parts = rawToken.split('.')
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
                results.jwtPayload = { sub: payload.sub, role: payload.role, exp: payload.exp }
            }
        } catch (e: unknown) {
            results.jwtDecodeError = e instanceof Error ? e.message : String(e)
        }
    }

    // Test 2: createClient with edgeFunctionToken + getCurrentUser
    if (rawToken) {
        try {
            const client = createClient({ baseUrl: internalUrl, edgeFunctionToken: rawToken })
            const { data, error } = await client.auth.getCurrentUser()
            results.edgeFunctionToken_getCurrentUser = {
                data: data ?? 'undefined',
                error: error?.message ?? null,
            }
        } catch (e: unknown) {
            results.edgeFunctionToken_exception = e instanceof Error ? e.message : String(e)
        }
    }

    // Test 3: createClient with anonKey (API_KEY value) + try a DB write
    if (apiKey) {
        try {
            const client = createClient({ baseUrl: internalUrl, anonKey: apiKey })
            const { error } = await client.database.from('email_integrations').insert([{
                user_id: '00000000-0000-0000-0000-000000000001',
                provider: '_debug_apikey_',
                access_token: 'debug',
                metadata: {},
                connected_at: new Date().toISOString(),
            }])
            results.apiKey_insert = { error: error?.message ?? null, success: !error }
            // Clean up
            if (!error) {
                await client.database.from('email_integrations').delete()
                    .eq('user_id', '00000000-0000-0000-0000-000000000001')
                    .eq('provider', '_debug_apikey_')
            }
        } catch (e: unknown) {
            results.apiKey_exception = e instanceof Error ? e.message : String(e)
        }
    }

    // Test 4: Raw PostgREST HTTP call with anonKey
    try {
        const resp = await fetch(`${internalUrl}/rest/v1/email_integrations`, {
            method: 'HEAD',
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
            },
        })
        results.postgrest_head = { status: resp.status, ok: resp.ok }
    } catch (e: unknown) {
        results.postgrest_exception = e instanceof Error ? e.message : String(e)
    }

    return new Response(JSON.stringify(results, null, 2), {
        headers: { 'Content-Type': 'application/json' },
    })
}

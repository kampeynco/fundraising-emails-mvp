import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request): Promise<Response> => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://npxklgkoemybgivdrmka.supabase.co'
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const authHeader = req.headers.get('Authorization')
    const rawToken = authHeader ? authHeader.replace('Bearer ', '') : null

    const results: Record<string, unknown> = {
        supabaseUrl,
        hasAnonKey: !!anonKey,
        hasServiceRoleKey: !!serviceRoleKey,
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

    // Test 2: validate the caller JWT with Supabase Auth
    if (rawToken) {
        try {
            const client = createClient(supabaseUrl, anonKey)
            const { data, error } = await client.auth.getUser(rawToken)
            results.auth_getUser = {
                data: data ?? 'undefined',
                error: error?.message ?? null,
            }
        } catch (e: unknown) {
            results.auth_getUser_exception = e instanceof Error ? e.message : String(e)
        }
    }

    // Test 3: service-role client DB write
    if (serviceRoleKey) {
        try {
            const client = createClient(supabaseUrl, serviceRoleKey, {
                auth: { persistSession: false, autoRefreshToken: false },
            })
            const { error } = await client.from('email_integrations').insert([{
                user_id: '00000000-0000-0000-0000-000000000001',
                provider: '_debug_service_role_',
                access_token: 'debug',
                metadata: {},
                connected_at: new Date().toISOString(),
            }])
            results.serviceRole_insert = { error: error?.message ?? null, success: !error }
            // Clean up
            if (!error) {
                await client.from('email_integrations').delete()
                    .eq('user_id', '00000000-0000-0000-0000-000000000001')
                    .eq('provider', '_debug_service_role_')
            }
        } catch (e: unknown) {
            results.serviceRole_exception = e instanceof Error ? e.message : String(e)
        }
    }

    // Test 4: Raw PostgREST HTTP call with anonKey
    try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/email_integrations`, {
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
})

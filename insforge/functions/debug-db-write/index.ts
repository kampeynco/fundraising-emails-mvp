import { createClient } from 'npm:@insforge/sdk'

export default async function (req: Request): Promise<Response> {
    const internalUrl = Deno.env.get('INSFORGE_INTERNAL_URL')
    const baseUrl = Deno.env.get('INSFORGE_BASE_URL')
    const anonKey = Deno.env.get('ANON_KEY')

    // Test 1: getCurrentUser with edgeFunctionToken from Authorization header
    const authHeader = req.headers.get('Authorization')
    const userToken = authHeader ? authHeader.replace('Bearer ', '') : null

    const results: Record<string, unknown> = {
        internalUrl,
        baseUrl,
        hasAnonKey: !!anonKey,
        hasUserToken: !!userToken,
    }

    // Test with internal URL + edgeFunctionToken
    if (userToken) {
        try {
            const client = createClient({ baseUrl: internalUrl, edgeFunctionToken: userToken })
            const { data: userData, error: authError } = await client.auth.getCurrentUser()
            results.getCurrentUser_internal = {
                userId: userData?.user?.id || null,
                error: authError?.message || null,
            }

            if (userData?.user?.id) {
                // Test upsert
                const { error: upsertError } = await client.database.from('email_integrations').upsert(
                    {
                        user_id: userData.user.id,
                        provider: '_debug_test_',
                        access_token: 'debug_token',
                        metadata: { test: true },
                        connected_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id,provider' }
                )
                results.upsert_internal = { error: upsertError?.message || null, success: !upsertError }

                // Clean up test row
                await client.database.from('email_integrations').delete().eq('user_id', userData.user.id).eq('provider', '_debug_test_')
            }
        } catch (e: unknown) {
            results.internal_exception = e instanceof Error ? e.message : String(e)
        }
    }

    // Test with anonKey
    if (anonKey) {
        try {
            const client = createClient({ baseUrl: internalUrl, anonKey })
            const { data: userData, error: authError } = await client.auth.getCurrentUser()
            results.getCurrentUser_anon = {
                userId: userData?.user?.id || null,
                error: authError?.message || null,
            }
        } catch (e: unknown) {
            results.anon_exception = e instanceof Error ? e.message : String(e)
        }
    }

    return new Response(JSON.stringify(results, null, 2), {
        headers: { 'Content-Type': 'application/json' },
    })
}

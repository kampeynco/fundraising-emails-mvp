import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// ── Types ────────────────────────────────────────────────────
export interface BrandKitSocial {
    platform: string
    url: string
}

export interface BrandKitColors {
    background: string
    container: string
    accent: string
    button_text: string
    foreground: string
    header: string
    footer: string
}

export interface BrandKitData {
    id?: string
    kit_name: string
    org_type: string
    org_level: string
    office_sought: string
    state: string
    district: string
    website: string
    brand_summary: string
    address: string
    tone_of_voice: string
    copyright: string
    footer: string
    disclaimers: string
    socials: BrandKitSocial[]
    colors: BrandKitColors
    primary_logo_url: string
    icon_logo_url: string
    show_header: boolean
    show_footer: boolean
}

const DEFAULT_COLORS: BrandKitColors = {
    background: '#ffffff',
    container: '#ffffff',
    accent: '#e8614d',
    button_text: '#ffffff',
    foreground: '#1e293b',
    header: '#0f2137',
    footer: '#0f2137',
}

const DEFAULT_BRAND_KIT: BrandKitData = {
    kit_name: '',
    org_type: '',
    org_level: '',
    office_sought: '',
    state: '',
    district: '',
    website: '',
    brand_summary: '',
    address: '',
    tone_of_voice: 'Inspirational',
    copyright: '',
    footer: '',
    disclaimers: '',
    socials: [
        { platform: 'Instagram', url: '' },
        { platform: 'Bluesky', url: '' },
    ],
    colors: DEFAULT_COLORS,
    primary_logo_url: '',
    icon_logo_url: '',
    show_header: false,
    show_footer: false,
}

// ── Hook ─────────────────────────────────────────────────────
export function useBrandKit() {
    const { user } = useAuth()
    const [data, setData] = useState<BrandKitData>(DEFAULT_BRAND_KIT)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    // Fetch brand kit on mount
    useEffect(() => {
        if (!user) return

        const fetchBrandKit = async () => {
            setLoading(true)
            setError(null)

            const { data: row, error: fetchError } = await supabase
                .from('brand_kits')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle()

            if (fetchError) {
                console.error('Error fetching brand kit:', fetchError)
                setError(fetchError.message)
            } else if (row) {
                setData({
                    id: row.id,
                    kit_name: row.kit_name || '',
                    org_type: (row as any).org_type || '',
                    org_level: (row as any).org_level || '',
                    office_sought: (row as any).office_sought || '',
                    state: (row as any).state || '',
                    district: (row as any).district || '',
                    website: row.website || '',
                    brand_summary: row.brand_summary || '',
                    address: row.address || '',
                    tone_of_voice: row.tone_of_voice || 'Inspirational',
                    copyright: row.copyright || '',
                    footer: row.footer || '',
                    disclaimers: row.disclaimers || '',
                    socials: (row.socials as unknown as BrandKitSocial[]) || DEFAULT_BRAND_KIT.socials,
                    colors: { ...DEFAULT_COLORS, ...((row.colors as unknown as BrandKitColors) || {}) },
                    primary_logo_url: row.primary_logo_url || '',
                    icon_logo_url: row.icon_logo_url || '',
                    show_header: (row as any).show_header ?? false,
                    show_footer: (row as any).show_footer ?? false,
                })
            }
            // If no row exists, keep defaults — it will be created on first save

            setLoading(false)
        }

        fetchBrandKit()
    }, [user])

    // Save (upsert) brand kit
    const save = useCallback(async () => {
        if (!user) return

        setSaving(true)
        setError(null)

        const payload = {
            user_id: user.id,
            kit_name: data.kit_name,
            org_type: data.org_type,
            org_level: data.org_level,
            office_sought: data.office_sought,
            state: data.state,
            district: data.district,
            website: data.website,
            brand_summary: data.brand_summary,
            address: data.address,
            tone_of_voice: data.tone_of_voice,
            copyright: data.copyright,
            footer: data.footer,
            disclaimers: data.disclaimers,
            socials: data.socials,
            colors: data.colors,
            primary_logo_url: data.primary_logo_url,
            icon_logo_url: data.icon_logo_url,
            show_header: data.show_header,
            show_footer: data.show_footer,
        }

        const { data: row, error: saveError } = await supabase
            .from('brand_kits')
            .upsert(payload as any, { onConflict: 'user_id' })
            .select()
            .single()

        if (saveError) {
            console.error('Error saving brand kit:', saveError)
            setError(saveError.message)
        } else if (row) {
            setData(prev => ({ ...prev, id: row.id }))
            setLastSaved(new Date())
        }

        setSaving(false)
    }, [user, data])
    // Upload logo to Supabase Storage
    const uploadLogo = useCallback(async (file: File, type: 'primary' | 'icon') => {
        if (!user) return

        const ext = file.name.split('.').pop()
        const prefix = `${user.id}/${type}-logo`

        // Delete any existing logo files for this type (handles extension changes)
        const { data: existingFiles } = await supabase.storage
            .from('brand-assets')
            .list(user.id, { search: `${type}-logo` })

        if (existingFiles && existingFiles.length > 0) {
            const filesToDelete = existingFiles
                .filter(f => f.name.startsWith(`${type}-logo`))
                .map(f => `${user.id}/${f.name}`)
            if (filesToDelete.length > 0) {
                await supabase.storage.from('brand-assets').remove(filesToDelete)
            }
        }

        // Upload with timestamp to bust CDN/browser cache
        const timestamp = Date.now()
        const path = `${prefix}-${timestamp}.${ext}`

        const { error: uploadError } = await supabase.storage
            .from('brand-assets')
            .upload(path, file, { upsert: true })

        if (uploadError) {
            console.error('Error uploading logo:', uploadError)
            setError(uploadError.message)
            return
        }

        const { data: urlData } = supabase.storage
            .from('brand-assets')
            .getPublicUrl(path)

        // Add cache-busting query param
        const url = `${urlData.publicUrl}?t=${timestamp}`
        setData(prev => ({
            ...prev,
            [type === 'primary' ? 'primary_logo_url' : 'icon_logo_url']: url,
        }))
    }, [user])

    return {
        data,
        setData,
        loading,
        saving,
        error,
        lastSaved,
        save,
        uploadLogo,
    }
}

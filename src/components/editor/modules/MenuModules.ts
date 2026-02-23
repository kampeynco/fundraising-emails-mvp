import type { ModuleTemplate } from '../types'

/** Helper to get brand color or fallback */
function c(brandKit: any, key: string, fallback: string): string {
    if (!brandKit?.colors) return fallback
    const colors = typeof brandKit.colors === 'string' ? JSON.parse(brandKit.colors) : brandKit.colors
    return colors[key] || fallback
}

function logo(brandKit: any): string {
    return brandKit?.primary_logo_url || ''
}

function orgName(brandKit: any): string {
    return brandKit?.kit_name || 'Organization'
}

export const menuModules: ModuleTemplate[] = [
    {
        id: 'menu-1',
        name: 'Menu 1',
        category: 'menu',
        thumbnailHtml: '<div style="background:#1a3a5c;color:white;padding:10px 12px;font-size:11px;display:flex;justify-content:space-between;align-items:center;border-radius:4px"><strong>Logo</strong><span style="font-size:9px">Home · About · Donate</span></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${c(bk, 'primary', '#1a3a5c')};font-family:Arial,sans-serif;">
                <tr>
                    <td style="padding:16px 24px;">
                        ${logo(bk) ? `<img src="${logo(bk)}" alt="${orgName(bk)}" style="height:36px;max-width:180px;" />` : `<span style="color:white;font-size:18px;font-weight:bold;">${orgName(bk)}</span>`}
                    </td>
                    <td align="right" style="padding:16px 24px;">
                        <a href="#" style="color:rgba(255,255,255,0.85);text-decoration:none;font-size:13px;margin-left:20px;">Home</a>
                        <a href="#" style="color:rgba(255,255,255,0.85);text-decoration:none;font-size:13px;margin-left:20px;">About</a>
                        <a href="#" style="color:rgba(255,255,255,0.85);text-decoration:none;font-size:13px;margin-left:20px;">Donate</a>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
    {
        id: 'menu-2',
        name: 'Menu 2',
        category: 'menu',
        thumbnailHtml: '<div style="background:#fff;padding:10px 12px;font-size:11px;display:flex;justify-content:center;align-items:center;gap:16px;border-radius:4px;border:1px solid #eee"><strong style="color:#1a3a5c">Logo</strong><span style="font-size:9px;color:#666">Home · About · Donate</span></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;font-family:Arial,sans-serif;border-bottom:2px solid ${c(bk, 'primary', '#1a3a5c')};">
                <tr>
                    <td align="center" style="padding:18px 24px;">
                        ${logo(bk) ? `<img src="${logo(bk)}" alt="${orgName(bk)}" style="height:40px;max-width:200px;" />` : `<span style="color:${c(bk, 'primary', '#1a3a5c')};font-size:20px;font-weight:bold;">${orgName(bk)}</span>`}
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding:0 24px 14px;">
                        <a href="#" style="color:${c(bk, 'primary', '#1a3a5c')};text-decoration:none;font-size:12px;margin:0 12px;text-transform:uppercase;letter-spacing:1px;">Home</a>
                        <a href="#" style="color:${c(bk, 'primary', '#1a3a5c')};text-decoration:none;font-size:12px;margin:0 12px;text-transform:uppercase;letter-spacing:1px;">About</a>
                        <a href="#" style="color:${c(bk, 'primary', '#1a3a5c')};text-decoration:none;font-size:12px;margin:0 12px;text-transform:uppercase;letter-spacing:1px;">Donate</a>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
    {
        id: 'menu-3',
        name: 'Menu 3',
        category: 'menu',
        thumbnailHtml: '<div style="padding:10px 12px;font-size:11px;display:flex;justify-content:space-between;align-items:center;border-radius:4px;border-bottom:2px solid #e8614d"><strong style="color:#1a3a5c">Logo</strong><span style="background:#e8614d;color:white;padding:3px 8px;border-radius:3px;font-size:8px">DONATE</span></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;font-family:Arial,sans-serif;border-bottom:1px solid #eee;">
                <tr>
                    <td style="padding:16px 24px;">
                        ${logo(bk) ? `<img src="${logo(bk)}" alt="${orgName(bk)}" style="height:36px;max-width:180px;" />` : `<span style="color:${c(bk, 'primary', '#1a3a5c')};font-size:18px;font-weight:bold;">${orgName(bk)}</span>`}
                    </td>
                    <td align="right" style="padding:16px 24px;">
                        <a href="#" style="background-color:${c(bk, 'accent', '#e8614d')};color:white;text-decoration:none;font-size:13px;padding:8px 20px;border-radius:4px;font-weight:bold;">DONATE</a>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
    {
        id: 'menu-4',
        name: 'Menu 4',
        category: 'menu',
        thumbnailHtml: '<div style="background:linear-gradient(135deg,#1a3a5c,#0f2137);color:white;padding:12px;font-size:11px;text-align:center;border-radius:4px"><strong>LOGO</strong><div style="font-size:8px;margin-top:4px;opacity:0.7">Home · Mission · Donate · Contact</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${c(bk, 'primary', '#1a3a5c')};font-family:Arial,sans-serif;">
                <tr>
                    <td align="center" style="padding:20px 24px 10px;">
                        ${logo(bk) ? `<img src="${logo(bk)}" alt="${orgName(bk)}" style="height:44px;max-width:220px;" />` : `<span style="color:white;font-size:22px;font-weight:bold;letter-spacing:1px;">${orgName(bk).toUpperCase()}</span>`}
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding:6px 24px 16px;">
                        <a href="#" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:11px;margin:0 10px;letter-spacing:0.5px;">Home</a>
                        <a href="#" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:11px;margin:0 10px;letter-spacing:0.5px;">Mission</a>
                        <a href="#" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:11px;margin:0 10px;letter-spacing:0.5px;">Donate</a>
                        <a href="#" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:11px;margin:0 10px;letter-spacing:0.5px;">Contact</a>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
]

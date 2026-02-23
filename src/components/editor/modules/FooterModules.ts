import type { ModuleTemplate } from '../types'

function c(brandKit: any, key: string, fallback: string): string {
    if (!brandKit?.colors) return fallback
    const colors = typeof brandKit.colors === 'string' ? JSON.parse(brandKit.colors) : brandKit.colors
    return colors[key] || fallback
}

function orgName(bk: any): string {
    return bk?.kit_name || 'Organization'
}

function copyright(bk: any): string {
    return bk?.copyright || `Paid for by ${orgName(bk)}`
}

export const footerModules: ModuleTemplate[] = [
    {
        id: 'footer-1',
        name: 'Footer 1',
        category: 'footer',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#f5f5f5;text-align:center"><div style="font-size:8px;color:#999">Paid for by Org · Unsubscribe · View in browser</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background-color:#f5f5f5;">
                <tr>
                    <td align="center" style="padding:24px 32px;">
                        <p style="margin:0 0 8px;font-size:12px;color:#999;">${copyright(bk)}</p>
                        <p style="margin:0;font-size:11px;color:#bbb;">
                            <a href="#" style="color:#999;text-decoration:underline;">Unsubscribe</a>
                            &nbsp;&middot;&nbsp;
                            <a href="#" style="color:#999;text-decoration:underline;">View in browser</a>
                            &nbsp;&middot;&nbsp;
                            <a href="#" style="color:#999;text-decoration:underline;">Privacy Policy</a>
                        </p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
    {
        id: 'footer-2',
        name: 'Footer 2',
        category: 'footer',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#1a3a5c;text-align:center"><div style="font-size:8px;color:rgba(255,255,255,0.5)">Paid for by Org · Full disclaimers</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background-color:${c(bk, 'primary', '#1a3a5c')};">
                <tr>
                    <td align="center" style="padding:28px 32px;">
                        <p style="margin:0 0 10px;font-size:12px;color:rgba(255,255,255,0.5);">${copyright(bk)}</p>
                        <p style="margin:0 0 12px;font-size:11px;color:rgba(255,255,255,0.35);">
                            <a href="#" style="color:rgba(255,255,255,0.5);text-decoration:underline;">Unsubscribe</a>
                            &nbsp;&middot;&nbsp;
                            <a href="#" style="color:rgba(255,255,255,0.5);text-decoration:underline;">Privacy</a>
                            &nbsp;&middot;&nbsp;
                            <a href="#" style="color:rgba(255,255,255,0.5);text-decoration:underline;">Contact</a>
                        </p>
                        <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.25);">This email was sent to you because you previously signed up to receive communications from ${orgName(bk)}.</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
    {
        id: 'footer-3',
        name: 'Footer 3',
        category: 'footer',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#fff;border-top:2px solid #e8614d;text-align:center"><div style="font-size:8px;color:#999">Logo · Disclaimers · Links</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;border-top:2px solid ${c(bk, 'accent', '#e8614d')};">
                <tr>
                    <td align="center" style="padding:24px 32px 12px;">
                        <p style="margin:0;font-size:14px;font-weight:bold;color:${c(bk, 'primary', '#1a3a5c')};">${orgName(bk)}</p>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding:0 32px 12px;">
                        <p style="margin:0;font-size:11px;color:#999;">
                            <a href="#" style="color:#999;text-decoration:underline;">Unsubscribe</a>
                            &nbsp;&middot;&nbsp;
                            <a href="#" style="color:#999;text-decoration:underline;">Update Preferences</a>
                            &nbsp;&middot;&nbsp;
                            <a href="#" style="color:#999;text-decoration:underline;">View in Browser</a>
                        </p>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding:0 32px 24px;">
                        <p style="margin:0;font-size:10px;color:#ccc;">${copyright(bk)}<br/>Not authorized by any candidate or candidate's committee.</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
]

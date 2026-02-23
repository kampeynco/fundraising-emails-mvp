import type { ModuleTemplate } from '../types'

function c(brandKit: any, key: string, fallback: string): string {
    if (!brandKit?.colors) return fallback
    const colors = typeof brandKit.colors === 'string' ? JSON.parse(brandKit.colors) : brandKit.colors
    return colors[key] || fallback
}

export const ctaModules: ModuleTemplate[] = [
    {
        id: 'cta-1',
        name: 'CTA 1',
        category: 'cta',
        thumbnailHtml: '<div style="padding:12px;text-align:center;border-radius:4px;background:#fff;border:1px solid #eee"><span style="background:#e8614d;color:white;padding:5px 16px;border-radius:4px;font-size:10px;font-weight:bold">DONATE NOW →</span></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
                <tr>
                    <td align="center" style="padding:28px 32px;">
                        <a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:16px 48px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:18px;letter-spacing:0.5px;">DONATE NOW →</a>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'cta-2',
        name: 'CTA 2',
        category: 'cta',
        thumbnailHtml: '<div style="padding:12px;text-align:center;border-radius:4px;background:#fff;border:1px solid #eee"><span style="border:2px solid #e8614d;color:#e8614d;padding:4px 14px;border-radius:4px;font-size:10px;font-weight:bold">LEARN MORE</span></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
                <tr>
                    <td align="center" style="padding:24px 32px;">
                        <a href="#" style="display:inline-block;border:2px solid ${c(bk, 'accent', '#e8614d')};color:${c(bk, 'accent', '#e8614d')};padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">LEARN MORE</a>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'cta-3',
        name: 'CTA 3',
        category: 'cta',
        thumbnailHtml: '<div style="padding:10px 12px;text-align:center;border-radius:4px;background:#faf8f5"><div style="font-size:8px;color:#888;margin-bottom:4px">Can you chip in?</div><span style="background:#e8614d;color:white;padding:4px 14px;border-radius:4px;font-size:10px;font-weight:bold">YES, I\'LL GIVE</span></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;background-color:#faf8f5;">
                <tr>
                    <td align="center" style="padding:28px 32px;">
                        <p style="margin:0 0 16px;font-size:18px;color:${c(bk, 'primary', '#1a3a5c')};font-weight:600;">Can you chip in before midnight?</p>
                        <a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:15px 44px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:17px;">YES, I'LL GIVE →</a>
                        <p style="margin:14px 0 0;font-size:12px;color:#999;">Your donation is tax-deductible</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
    {
        id: 'cta-4',
        name: 'CTA 4',
        category: 'cta',
        thumbnailHtml: '<div style="padding:10px 12px;text-align:center;border-radius:4px;background:#1a3a5c"><span style="background:#e8614d;color:white;padding:4px 14px;border-radius:4px;font-size:10px;font-weight:bold">RUSH MY GIFT</span><div style="font-size:7px;color:rgba(255,255,255,0.5);margin-top:3px">Match expires at midnight</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background-color:${c(bk, 'primary', '#1a3a5c')};">
                <tr>
                    <td align="center" style="padding:32px;">
                        <a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:16px 48px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:18px;">RUSH MY GIFT →</a>
                        <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">Your 2X match expires at midnight</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
    {
        id: 'cta-5',
        name: 'CTA 5',
        category: 'cta',
        thumbnailHtml: '<div style="padding:10px 12px;text-align:center;border-radius:4px;background:#fff;border:1px solid #eee"><div style="display:flex;gap:4px;justify-content:center"><span style="background:#e8614d;color:white;padding:4px 10px;border-radius:3px;font-size:8px;font-weight:bold">DONATE $25</span><span style="background:#1a3a5c;color:white;padding:4px 10px;border-radius:3px;font-size:8px;font-weight:bold">OTHER</span></div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
                <tr>
                    <td align="center" style="padding:28px 32px;">
                        <table cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:0 6px;"><a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">DONATE $25</a></td>
                                <td style="padding:0 6px;"><a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">DONATE $50</a></td>
                                <td style="padding:0 6px;"><a href="#" style="display:inline-block;background-color:${c(bk, 'primary', '#1a3a5c')};color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">OTHER</a></td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
]

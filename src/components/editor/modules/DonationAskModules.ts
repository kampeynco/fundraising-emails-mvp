import type { ModuleTemplate } from '../types'

function c(brandKit: any, key: string, fallback: string): string {
    if (!brandKit?.colors) return fallback
    const colors = typeof brandKit.colors === 'string' ? JSON.parse(brandKit.colors) : brandKit.colors
    return colors[key] || fallback
}

export const donationModules: ModuleTemplate[] = [
    {
        id: 'donation-1',
        name: 'Donation 1',
        category: 'donation',
        thumbnailHtml: '<div style="padding:10px 12px;text-align:center;border-radius:4px;background:#faf8f5"><div style="font-size:10px;font-weight:bold;color:#1a3a5c;margin-bottom:6px">Make Your Impact</div><div style="display:flex;gap:4px;justify-content:center"><span style="background:#e8614d;color:white;padding:3px 8px;border-radius:3px;font-size:8px;font-weight:bold">$25</span><span style="background:#e8614d;color:white;padding:3px 8px;border-radius:3px;font-size:8px;font-weight:bold">$50</span><span style="background:#e8614d;color:white;padding:3px 8px;border-radius:3px;font-size:8px;font-weight:bold">$100</span></div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background-color:#faf8f5;">
                <tr>
                    <td align="center" style="padding:32px;">
                        <h2 style="margin:0 0 8px;font-size:22px;color:${c(bk, 'primary', '#1a3a5c')};font-weight:700;">Make Your Impact</h2>
                        <p style="margin:0 0 20px;font-size:14px;color:#666;">Choose your gift amount:</p>
                        <table cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:0 6px;"><a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">$25</a></td>
                                <td style="padding:0 6px;"><a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">$50</a></td>
                                <td style="padding:0 6px;"><a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">$100</a></td>
                                <td style="padding:0 6px;"><a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">$250</a></td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
    {
        id: 'donation-2',
        name: 'Donation 2',
        category: 'donation',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#fff;border:1px solid #eee;text-align:center"><div style="font-size:10px;font-weight:bold;color:#1a3a5c;margin-bottom:4px">Goal: $50,000</div><div style="background:#e5e7eb;border-radius:10px;height:8px;overflow:hidden"><div style="background:#e8614d;height:100%;width:65%;border-radius:10px"></div></div><div style="font-size:8px;color:#888;margin-top:3px">65% funded</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
                <tr>
                    <td align="center" style="padding:32px;">
                        <h2 style="margin:0 0 4px;font-size:22px;color:${c(bk, 'primary', '#1a3a5c')};font-weight:700;">$32,500 raised</h2>
                        <p style="margin:0 0 16px;font-size:14px;color:#888;">of $50,000 goal</p>
                        <table width="80%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="background-color:#e5e7eb;border-radius:10px;height:14px;overflow:hidden;">
                                    <div style="background-color:${c(bk, 'accent', '#e8614d')};height:14px;width:65%;border-radius:10px;"></div>
                                </td>
                            </tr>
                        </table>
                        <p style="margin:12px 0 0;font-size:12px;color:#999;">1,247 supporters • 3 days left</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'donation-3',
        name: 'Donation 3',
        category: 'donation',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#fff;border:1px solid #eee"><div style="font-size:8px;color:#888;margin-bottom:4px">Your impact:</div><div style="font-size:9px;color:#333;line-height:1.6">$25 → meals · $50 → supplies · $100 → care</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
                <tr>
                    <td style="padding:28px 32px;">
                        <h2 style="margin:0 0 16px;font-size:20px;color:${c(bk, 'primary', '#1a3a5c')};font-weight:700;text-align:center;">Here's What Your Gift Provides</h2>
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td align="center" style="padding:12px;border:1px solid #f0f0f0;border-radius:8px;width:33%;">
                                    <p style="margin:0 0 4px;font-size:24px;font-weight:bold;color:${c(bk, 'accent', '#e8614d')};">$25</p>
                                    <p style="margin:0;font-size:12px;color:#666;">Provides 50 meals for families in need</p>
                                </td>
                                <td width="8"></td>
                                <td align="center" style="padding:12px;border:1px solid #f0f0f0;border-radius:8px;width:33%;">
                                    <p style="margin:0 0 4px;font-size:24px;font-weight:bold;color:${c(bk, 'accent', '#e8614d')};">$50</p>
                                    <p style="margin:0;font-size:12px;color:#666;">Supplies a classroom for one month</p>
                                </td>
                                <td width="8"></td>
                                <td align="center" style="padding:12px;border:1px solid #f0f0f0;border-radius:8px;width:33%;">
                                    <p style="margin:0 0 4px;font-size:24px;font-weight:bold;color:${c(bk, 'accent', '#e8614d')};">$100</p>
                                    <p style="margin:0;font-size:12px;color:#666;">Funds one full week of medical care</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'donation-4',
        name: 'Donation 4',
        category: 'donation',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#1a3a5c;text-align:center"><div style="font-size:10px;font-weight:bold;color:white;margin-bottom:4px">2X MATCH</div><div style="font-size:8px;color:rgba(255,255,255,0.6)">$1 = $2 through midnight</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background-color:${c(bk, 'primary', '#1a3a5c')};">
                <tr>
                    <td align="center" style="padding:36px 32px;">
                        <p style="margin:0 0 4px;font-size:14px;color:${c(bk, 'accent', '#e8614d')};text-transform:uppercase;letter-spacing:2px;font-weight:bold;">⚡ Limited Time</p>
                        <h2 style="margin:0 0 10px;font-size:32px;color:white;font-weight:800;">2X MATCH ACTIVE</h2>
                        <p style="margin:0 0 24px;font-size:16px;color:rgba(255,255,255,0.7);">Every dollar you give right now will be DOUBLED by an anonymous donor.</p>
                        <a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:14px 40px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:17px;">DOUBLE MY GIFT →</a>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
]

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
        thumbnailHtml: '<div style="padding:10px 12px;text-align:center;border-radius:4px;background:#faf8f5"><div style="display:grid;grid-template-columns:1fr 1fr;gap:3px"><span style="background:#e8614d;color:white;padding:3px 0;border-radius:3px;font-size:7px;font-weight:bold;text-align:center">$10</span><span style="background:#c0392b;color:white;padding:3px 0;border-radius:3px;font-size:7px;font-weight:bold;text-align:center">$25</span><span style="background:#1a3a5c;color:white;padding:3px 0;border-radius:3px;font-size:7px;font-weight:bold;text-align:center">$50</span><span style="background:#e8614d;color:white;padding:3px 0;border-radius:3px;font-size:7px;font-weight:bold;text-align:center">$100</span><span style="background:#c0392b;color:white;padding:3px 0;border-radius:3px;font-size:7px;font-weight:bold;text-align:center">$250</span><span style="background:#1a3a5c;color:white;padding:3px 0;border-radius:3px;font-size:7px;font-weight:bold;text-align:center">Other</span></div></div>',
        renderHtml: (bk) => {
            const accent = c(bk, 'accent', '#e8614d')
            const buttons = [
                { label: '$10', href: '#donate-10', bg: accent },
                { label: '$25', href: '#donate-25', bg: accent },
                { label: '$50', href: '#donate-50', bg: accent },
                { label: '$100', href: '#donate-100', bg: accent },
                { label: '$250', href: '#donate-250', bg: accent },
                { label: 'Other', href: '#donate-other', bg: accent },
            ]
            const rows = []
            for (let i = 0; i < buttons.length; i += 2) {
                const b1 = buttons[i]
                const b2 = buttons[i + 1]
                rows.push(`
                    <tr>
                        <td class="don-btn-cell" style="padding:4px 4px 4px 0;width:50%;">
                            <a href="${b1.href}" style="display:block;background-color:${b1.bg};color:white;padding:14px 0;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;text-align:center;">${b1.label}</a>
                        </td>
                        <td class="don-btn-cell" style="padding:4px 0 4px 4px;width:50%;">
                            <a href="${b2.href}" style="display:block;background-color:${b2.bg};color:white;padding:14px 0;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;text-align:center;">${b2.label}</a>
                        </td>
                    </tr>`)
            }
            return `
            <style>
                @media only screen and (max-width: 480px) {
                    .don-btn-cell {
                        display: block !important;
                        width: 100% !important;
                        padding: 4px 0 !important;
                    }
                }
            </style>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
                <tr>
                    <td style="padding:24px 32px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            ${rows.join('')}
                        </table>
                    </td>
                </tr>
            </table>`
        },
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
        // Compliant: deadline urgency without match claims (ActBlue Matching Program Standards)
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#1a3a5c;text-align:center"><div style="font-size:10px;font-weight:bold;color:white;margin-bottom:4px">DEADLINE TONIGHT</div><div style="font-size:8px;color:rgba(255,255,255,0.6)">Help us reach our goal before midnight</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background-color:${c(bk, 'primary', '#1a3a5c')};">
                <tr>
                    <td align="center" style="padding:36px 32px;">
                        <p style="margin:0 0 4px;font-size:14px;color:${c(bk, 'accent', '#e8614d')};text-transform:uppercase;letter-spacing:2px;font-weight:bold;">⚡ Deadline Approaching</p>
                        <h2 style="margin:0 0 10px;font-size:32px;color:white;font-weight:800;">We Need You Tonight</h2>
                        <p style="margin:0 0 24px;font-size:16px;color:rgba(255,255,255,0.7);">Our fundraising deadline closes at midnight. Every grassroots contribution brings us closer to our goal.</p>
                        <a href="#" style="display:inline-block;background-color:${c(bk, 'accent', '#e8614d')};color:white;padding:14px 40px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:17px;">GIVE NOW →</a>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
]

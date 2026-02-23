import type { ModuleTemplate } from '../types'

function c(brandKit: any, key: string, fallback: string): string {
    if (!brandKit?.colors) return fallback
    const colors = typeof brandKit.colors === 'string' ? JSON.parse(brandKit.colors) : brandKit.colors
    return colors[key] || fallback
}

export const contentModules: ModuleTemplate[] = [
    {
        id: 'content-1',
        name: 'Content 1',
        category: 'content',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#fff;border:1px solid #eee"><div style="font-size:9px;color:#555;line-height:1.5">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor...</div></div>',
        renderHtml: () => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;">
                <tr>
                    <td style="padding:24px 32px;">
                        <p style="margin:0;font-size:16px;color:#333;line-height:1.7;">I need to share something important with you today. What's happening right now could change everything — but only if we act together before time runs out.</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'content-2',
        name: 'Content 2',
        category: 'content',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#fff;border:1px solid #eee"><div style="font-size:10px;font-weight:bold;color:#1a3a5c;margin-bottom:4px">Story</div><div style="font-size:8px;color:#666;line-height:1.4">Two paragraphs with a heading...</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;">
                <tr>
                    <td style="padding:24px 32px;">
                        <h2 style="margin:0 0 16px;font-size:22px;color:${c(bk, 'primary', '#1a3a5c')};font-weight:700;">Here's What's at Stake</h2>
                        <p style="margin:0 0 14px;font-size:16px;color:#333;line-height:1.7;">Right now, families across the country are facing an impossible choice. And without your help today, thousands more will lose access to critical resources.</p>
                        <p style="margin:0;font-size:16px;color:#333;line-height:1.7;">But here's the good news: <strong>you</strong> can change that. Your gift today — no matter the size — will go directly to the people who need it most.</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'content-3',
        name: 'Content 3',
        category: 'content',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#faf8f5;border-left:3px solid #e8614d"><div style="font-size:9px;color:#555;line-height:1.5;font-style:italic">"Quote style callout block..."</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;">
                <tr>
                    <td style="padding:24px 32px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid ${c(bk, 'accent', '#e8614d')};">
                            <tr>
                                <td style="padding:16px 20px;background-color:#faf8f5;">
                                    <p style="margin:0;font-size:18px;color:#333;line-height:1.6;font-style:italic;">"When we come together, there's nothing we can't accomplish. Your generosity doesn't just help — it transforms lives."</p>
                                    <p style="margin:12px 0 0;font-size:13px;color:#888;">— Campaign Director</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'content-4',
        name: 'Content 4',
        category: 'content',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#fff;border:1px solid #eee"><div style="font-size:9px;color:#555;line-height:1.4">✓ Point one<br/>✓ Point two<br/>✓ Point three</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
                <tr>
                    <td style="padding:24px 32px;">
                        <h2 style="margin:0 0 16px;font-size:20px;color:${c(bk, 'primary', '#1a3a5c')};font-weight:700;">What Your Gift Provides:</h2>
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:8px 0;font-size:15px;color:#333;line-height:1.5;border-bottom:1px solid #f0f0f0;">
                                    <span style="color:${c(bk, 'accent', '#e8614d')};font-weight:bold;">✓</span>&nbsp;&nbsp;Emergency supplies to families in need
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;font-size:15px;color:#333;line-height:1.5;border-bottom:1px solid #f0f0f0;">
                                    <span style="color:${c(bk, 'accent', '#e8614d')};font-weight:bold;">✓</span>&nbsp;&nbsp;Medical resources for underserved communities
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;font-size:15px;color:#333;line-height:1.5;border-bottom:1px solid #f0f0f0;">
                                    <span style="color:${c(bk, 'accent', '#e8614d')};font-weight:bold;">✓</span>&nbsp;&nbsp;Education programs for at-risk youth
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;font-size:15px;color:#333;line-height:1.5;">
                                    <span style="color:${c(bk, 'accent', '#e8614d')};font-weight:bold;">✓</span>&nbsp;&nbsp;Long-term sustainability and community resilience
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'content-5',
        name: 'Content 5',
        category: 'content',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#fff;border:1px solid #eee"><div style="display:flex;gap:8px"><div style="width:50%;background:#eee;height:40px;border-radius:3px"></div><div style="width:50%;font-size:8px;color:#555;line-height:1.4">Image + text layout</div></div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;">
                <tr>
                    <td style="padding:24px 32px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td width="45%" style="vertical-align:top;padding-right:20px;">
                                    <div style="background-color:${c(bk, 'primary', '#1a3a5c')}15;border-radius:8px;height:200px;display:flex;align-items:center;justify-content:center;">
                                        <p style="color:${c(bk, 'primary', '#1a3a5c')};font-size:13px;text-align:center;opacity:0.5;">Image Here</p>
                                    </div>
                                </td>
                                <td width="55%" style="vertical-align:top;">
                                    <h3 style="margin:0 0 10px;font-size:20px;color:${c(bk, 'primary', '#1a3a5c')};font-weight:700;">Real Stories, Real Impact</h3>
                                    <p style="margin:0;font-size:15px;color:#444;line-height:1.6;">Meet Sarah — a single mother who, thanks to supporters like you, was able to keep her family together during the hardest time of her life.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
]

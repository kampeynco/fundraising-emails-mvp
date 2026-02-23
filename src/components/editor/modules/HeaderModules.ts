import type { ModuleTemplate } from '../types'

function c(brandKit: any, key: string, fallback: string): string {
    if (!brandKit?.colors) return fallback
    const colors = typeof brandKit.colors === 'string' ? JSON.parse(brandKit.colors) : brandKit.colors
    return colors[key] || fallback
}

function orgName(bk: any): string {
    return bk?.kit_name || 'Organization'
}

export const headerModules: ModuleTemplate[] = [
    {
        id: 'header-1',
        name: 'Header 1',
        category: 'header',
        thumbnailHtml: '<div style="padding:14px 12px;text-align:center;border-radius:4px;background:#faf8f5"><div style="font-size:14px;font-weight:bold;color:#1a3a5c">Big Headline</div><div style="font-size:9px;color:#888;margin-top:4px">Subheadline goes here</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;">
                <tr>
                    <td align="center" style="padding:40px 32px;">
                        <h1 style="margin:0 0 12px;font-size:32px;color:${c(bk, 'primary', '#1a3a5c')};line-height:1.2;font-weight:700;">Breaking News: Your Support Is Needed Now</h1>
                        <p style="margin:0;font-size:16px;color:#666;line-height:1.5;max-width:480px;">Together, we can make an extraordinary impact when it matters most.</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'header-2',
        name: 'Header 2',
        category: 'header',
        thumbnailHtml: '<div style="padding:14px 12px;border-radius:4px;background:#1a3a5c"><div style="font-size:13px;font-weight:bold;color:white">URGENT update</div><div style="font-size:8px;color:rgba(255,255,255,0.6);margin-top:3px">From the desk of the Director</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${c(bk, 'primary', '#1a3a5c')};font-family:Arial,sans-serif;">
                <tr>
                    <td style="padding:36px 32px;">
                        <p style="margin:0 0 8px;font-size:12px;color:${c(bk, 'accent', '#e8614d')};text-transform:uppercase;letter-spacing:2px;font-weight:bold;">Urgent Update</p>
                        <h1 style="margin:0 0 14px;font-size:28px;color:white;line-height:1.25;font-weight:700;">We need your help before midnight</h1>
                        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.5;">From the desk of ${orgName(bk)}</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '', width: 600 },
    },
    {
        id: 'header-3',
        name: 'Header 3',
        category: 'header',
        thumbnailHtml: '<div style="padding:12px;border-radius:4px;border-left:3px solid #e8614d;background:#faf8f5"><div style="font-size:12px;font-weight:bold;color:#1a3a5c">Match Deadline</div><div style="font-size:9px;color:#888;margin-top:2px">Every $1 → $2</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
                <tr>
                    <td style="padding:32px;border-left:4px solid ${c(bk, 'accent', '#e8614d')};">
                        <p style="margin:0 0 6px;font-size:11px;color:${c(bk, 'accent', '#e8614d')};text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">⚡ Match Deadline</p>
                        <h1 style="margin:0 0 12px;font-size:26px;color:${c(bk, 'primary', '#1a3a5c')};line-height:1.25;font-weight:700;">Every dollar you give will be DOUBLED</h1>
                        <p style="margin:0;font-size:15px;color:#555;line-height:1.5;">But only until midnight. Once the clock strikes 12, this opportunity is gone.</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'header-4',
        name: 'Header 4',
        category: 'header',
        thumbnailHtml: '<div style="padding:14px 12px;text-align:center;border-radius:4px;background:#faf8f5;border-top:3px solid #e8614d"><div style="font-size:8px;color:#e8614d;text-transform:uppercase;letter-spacing:1px">Breaking</div><div style="font-size:13px;font-weight:bold;color:#1a3a5c;margin-top:3px">Headline</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;border-top:4px solid ${c(bk, 'accent', '#e8614d')};">
                <tr>
                    <td align="center" style="padding:32px 32px 12px;">
                        <p style="margin:0 0 10px;font-size:11px;color:${c(bk, 'accent', '#e8614d')};text-transform:uppercase;letter-spacing:2px;font-weight:bold;">Breaking</p>
                        <h1 style="margin:0;font-size:30px;color:${c(bk, 'primary', '#1a3a5c')};line-height:1.2;font-weight:700;">A Message You Can't Afford to Miss</h1>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding:0 60px 28px;">
                        <hr style="border:none;border-top:1px solid #ddd;margin:16px 0" />
                        <p style="margin:0;font-size:15px;color:#666;line-height:1.5;">Dear Friend, what you're about to read will change the way you think about giving.</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'header-5',
        name: 'Header 5',
        category: 'header',
        thumbnailHtml: '<div style="padding:14px 12px;text-align:left;border-radius:4px;background:#fff;border:1px solid #eee"><div style="font-size:8px;color:#999">Friend,</div><div style="font-size:12px;font-weight:bold;color:#1a3a5c;margin-top:3px">Personal Letter</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;">
                <tr>
                    <td style="padding:36px 32px;">
                        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.4;">Friend,</p>
                        <h1 style="margin:0 0 14px;font-size:26px;color:${c(bk, 'primary', '#1a3a5c')};line-height:1.3;font-weight:700;">I'm writing to you because I believe you care about this as much as I do.</h1>
                        <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">Let me share something with you that's been keeping me up at night...</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
]

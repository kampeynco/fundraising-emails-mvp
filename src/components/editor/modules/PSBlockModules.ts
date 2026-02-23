import type { ModuleTemplate } from '../types'

function c(brandKit: any, key: string, fallback: string): string {
    if (!brandKit?.colors) return fallback
    const colors = typeof brandKit.colors === 'string' ? JSON.parse(brandKit.colors) : brandKit.colors
    return colors[key] || fallback
}

export const psModules: ModuleTemplate[] = [
    {
        id: 'ps-1',
        name: 'P.S. 1',
        category: 'ps',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#fff;border-top:1px solid #eee"><div style="font-size:9px;color:#555;font-style:italic"><strong>P.S.</strong> Every dollar is matched...</div></div>',
        renderHtml: () => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;border-top:1px solid #e5e7eb;">
                <tr>
                    <td style="padding:20px 32px;">
                        <p style="margin:0;font-size:15px;color:#444;line-height:1.6;font-style:italic;"><strong style="font-style:normal;">P.S.</strong> Every dollar you give today will be matched 2-to-1 by an anonymous donor. That means your $25 becomes $75 — but only through midnight tonight. Don't wait.</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'ps-2',
        name: 'P.S. 2',
        category: 'ps',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#faf8f5;border-left:3px solid #e8614d"><div style="font-size:9px;color:#555"><strong>P.S.</strong> Urgent reminder with accent...</div></div>',
        renderHtml: (bk) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;">
                <tr>
                    <td style="padding:20px 32px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid ${c(bk, 'accent', '#e8614d')};">
                            <tr>
                                <td style="padding:12px 16px;background-color:#faf8f5;">
                                    <p style="margin:0;font-size:15px;color:#444;line-height:1.6;"><strong>P.S.</strong> I almost forgot — this is the LAST email I can send about this matching gift opportunity. After midnight, the match expires and your donation won't be doubled. <a href="#" style="color:${c(bk, 'accent', '#e8614d')};font-weight:bold;">Please give now →</a></p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
    {
        id: 'ps-3',
        name: 'P.S. 3',
        category: 'ps',
        thumbnailHtml: '<div style="padding:10px 12px;border-radius:4px;background:#fff;border:1px solid #eee"><div style="font-size:9px;color:#555"><strong>P.P.S.</strong> Quick personal note...</div></div>',
        renderHtml: () => `
            <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Georgia,'Times New Roman',serif;">
                <tr>
                    <td style="padding:16px 32px 24px;">
                        <p style="margin:0;font-size:15px;color:#444;line-height:1.6;"><strong>P.P.S.</strong> If you've already given, thank you — truly. Would you consider forwarding this email to one friend who might care about our mission? Sometimes the biggest impact comes from simply sharing the ask.</p>
                    </td>
                </tr>
            </table>`,
        defaultProps: { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, backgroundColor: '#ffffff', width: 600 },
    },
]

export type ModuleCategory = 'menu' | 'header' | 'content' | 'donation' | 'cta' | 'ps' | 'footer'

export interface ModuleProps {
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
    backgroundColor: string
    width: number
    fontFamily?: string
    fontSize?: number
    fontColor?: string
}

export interface EditorBlock {
    id: string
    type: 'module' | 'raw-html'
    category?: ModuleCategory
    moduleId?: string
    html: string
    props: ModuleProps
}

export const DEFAULT_BLOCK_PROPS: ModuleProps = {
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    backgroundColor: '',
    width: 600,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 16,
    fontColor: '#333333',
}

export interface ModuleTemplate {
    id: string
    name: string
    category: ModuleCategory
    thumbnailHtml: string
    renderHtml: (brandKit: any) => string
    defaultProps: Partial<ModuleProps>
}

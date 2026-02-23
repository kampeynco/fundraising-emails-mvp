# Drag & Drop Email Editor — Implementation Plan

## Overview

Build a Postcards-style 4-panel drag-and-drop email editor that opens when a draft is selected. Loads existing `body_html` as a single editable canvas block (Approach A). Module templates use hardcoded structures with brand kit variables auto-applied (Option 3).

> [!IMPORTANT]
> The editor replaces the normal `DashboardLayout` sidebar with its own module panel layout. It needs a dedicated layout component.

---

## Architecture

```mermaid
graph LR
    A[DraftsPage / DashboardPage] -->|click draft| B[/dashboard/drafts/:id/edit]
    B --> C[EditorLayout]
    C --> D[ModuleSidebar - categories]
    C --> E[ModulePanel - variations]
    C --> F[EditorCanvas - drag & drop]
    C --> G[PropertiesPanel - right sidebar]
```

### 4-Panel Layout

| Panel | Width | Purpose |
|-------|-------|---------|
| **Module Sidebar** | 64px icon rail | Category icons: Menu, Header, Content, Donation Ask, CTA, P.S., Footer |
| **Module Panel** | 280px, slides in/out | Shows numbered template variations for the selected category |
| **Editor Canvas** | Flex remaining | Drop zone + rendered email preview |
| **Properties Panel** | 300px | Padding, width, font, background, links, image upload, mobile/desktop toggle |

---

## Module Categories

| Category | Icon | Template Count | Description |
|----------|------|---------------|-------------|
| Menu | `Menu01Icon` | 4-6 | Logo + nav links bar |
| Header | `TextIcon` | 4-6 | Hero text, headline + image |
| Content | `ParagraphIcon` | 4-6 | Body text blocks, story sections |
| Donation Ask | `MoneyReceiveSquareIcon` | 4-6 | Donation amounts, thermometers, impact stats |
| Call to Action | `CursorClick01Icon` | 4-6 | Donate buttons, styled CTAs |
| P.S. Block | `Edit02Icon` | 3-4 | Classic fundraising P.S. line |
| Footer | `Mail01Icon` | 3-4 | Disclaimers, unsubscribe, paid-for-by, socials |

Each variation auto-applies brand kit: colors, logo URL, org name, font preferences.

---

## Data Model

### Existing (no changes)
- `email_drafts.body_html` — stores the final composed HTML
- `brand_kits` — provides colors, logo, tone, disclaimers

### New Table: `draft_versions`

```sql
CREATE TABLE public.draft_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES public.email_drafts(id) ON DELETE CASCADE,
  body_html TEXT NOT NULL,
  version_number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Purpose: version history for rollback. Created on each save.

---

## Phased Roadmap

### Phase 1: Foundation
> Route, layout shell, basic drag & drop, module sidebar

#### Files

##### [NEW] `src/pages/DraftEditorPage.tsx`
- Main editor page component
- Fetches draft by ID from URL params, loads `body_html`
- Fetches brand kit for the user
- Manages editor state: selected module category, canvas blocks, selected block for properties
- Renders the 4-panel `EditorLayout`

##### [NEW] `src/components/editor/EditorLayout.tsx`
- The 4-panel flex layout container
- Module sidebar (left icon rail) + module panel (slides in/out) + canvas (center) + properties (right)

##### [NEW] `src/components/editor/ModuleSidebar.tsx`
- Vertical icon rail with category buttons
- Active state highlights selected category
- Hovering or clicking triggers the module panel slide-in

##### [NEW] `src/components/editor/ModulePanel.tsx`
- Shows template variations for the active category
- Each variation renders a thumbnail preview card
- Cards are draggable (HTML5 drag API or `@dnd-kit`)

##### [NEW] `src/components/editor/EditorCanvas.tsx`
- Drop zone for modules
- Renders the current email as a vertical stack of blocks
- Existing `body_html` loaded as a single "Raw HTML" block
- Drop indicators show between blocks when dragging

##### [NEW] `src/components/editor/PropertiesPanel.tsx`
- Right sidebar showing properties for the selected block
- Phase 1: padding (4-sided), background color, width
- Mobile/Desktop preview toggle

##### [MODIFY] `src/App.tsx`
- Add route: `/dashboard/drafts/:id/edit` → `DraftEditorPage`
- Route sits OUTSIDE `DashboardLayout` (editor has its own layout) but inside `ProtectedRoute`

##### [MODIFY] `src/pages/DraftsPage.tsx`
- Make draft cards clickable → navigate to `/dashboard/drafts/${draft.id}/edit`

##### [MODIFY] `src/pages/DashboardPage.tsx`
- Make recent draft rows clickable → navigate to `/dashboard/drafts/${draft.id}/edit`

#### Drag & Drop Approach
- Use `@dnd-kit/core` + `@dnd-kit/sortable` (lightweight, accessible, React-native)
- Canvas blocks are sortable items
- Module panel items are draggable sources

---

### Phase 2: Module Library
> All 7 categories with 4-6 brand-kit-integrated variations each

#### Files

##### [NEW] `src/components/editor/modules/` directory
- `MenuModules.tsx` — 4-6 menu bar variations
- `HeaderModules.tsx` — 4-6 hero/headline variations
- `ContentModules.tsx` — 4-6 body text block variations
- `DonationAskModules.tsx` — 4-6 donation-specific variations
- `CTAModules.tsx` — 4-6 button/CTA variations
- `PSBlockModules.tsx` — 3-4 P.S. line variations
- `FooterModules.tsx` — 3-4 footer variations

Each module exports:
```ts
interface ModuleTemplate {
  id: string
  name: string          // e.g. "Header 3"
  category: string
  thumbnail: ReactNode  // preview card for module panel
  renderHtml: (brandKit: BrandKit) => string  // final email HTML
  defaultProps: ModuleProps  // default padding, bg, etc.
}
```

##### [NEW] `src/components/editor/modules/registry.ts`
- Central registry mapping category → template[]
- Used by ModulePanel to render variations

---

### Phase 3: Rich Editing
> Inline text editing, image upload, link editing, mobile preview

#### Files

##### [MODIFY] `src/components/editor/EditorCanvas.tsx`
- Add `contentEditable` support for text blocks
- Double-click a block to enter inline edit mode
- Rich text toolbar (bold, italic, link) appears on text selection

##### [MODIFY] `src/components/editor/PropertiesPanel.tsx`
- Add link/button URL editing field
- Add image upload with Supabase storage integration
- Add font family picker (from brand kit fonts)
- Add font size, line height, letter spacing controls
- Mobile/Desktop preview toggle with responsive iframe

##### [NEW] `src/components/editor/ImageUploader.tsx`
- Uploads to Supabase storage bucket `editor-images`
- Returns public URL for embedding in module HTML

##### [NEW] `src/components/editor/RichTextToolbar.tsx`
- Floating toolbar on text selection
- Bold, Italic, Link, Alignment buttons

---

### Phase 4: Persistence
> Save, auto-save, version history

#### Files

##### [MODIFY] `src/pages/DraftEditorPage.tsx`
- **Save button**: composes all canvas blocks into final `body_html`, updates `email_drafts`
- **Auto-save**: debounced save every 30 seconds when changes detected
- **Version history**: on save, insert into `draft_versions` table

##### [NEW] `src/components/editor/VersionHistoryPanel.tsx`
- Slide-out panel showing version list with timestamps
- Click to preview a version, button to restore

##### [NEW] Supabase migration: `draft_versions` table
- As defined in Data Model above

##### [MODIFY] `src/components/editor/EditorLayout.tsx`
- Add save status indicator (Saved / Saving... / Unsaved changes)
- Add undo/redo state management

---

### Phase 5: Polish
> Animations, slide-in panel, hover effects, keyboard shortcuts

#### Enhancements

- **Module panel slide animation**: `transform: translateX()` with `transition` on open/close
- **Module hover previews**: scale-up and subtle glow on hover in module panel
- **Drop zone indicators**: animated dashed border pulse when dragging over canvas
- **Block selection**: subtle blue outline + floating action bar (move up, move down, duplicate, delete)
- **Keyboard shortcuts**: `Cmd+S` save, `Cmd+Z` undo, `Cmd+Shift+Z` redo, `Delete` remove block
- **Smooth transitions**: block reorder animations via `@dnd-kit` transitions
- **Loading skeleton**: shimmer skeleton while draft + brand kit load

---

## Verification Plan

### Automated
- TypeScript `tsc --noEmit` after each phase
- Vite dev server hot reload testing

### Manual (per phase)
| Phase | Verification |
|-------|-------------|
| P1 | Click draft → editor loads with body_html in canvas. Drag module from panel → drops into canvas. Properties panel shows for selected block. |
| P2 | All 7 categories show variations. Modules render with user's brand colors/logo. |
| P3 | Edit text inline. Upload image. Edit button URL. Mobile preview works. |
| P4 | Save persists to Supabase. Auto-save triggers. Version history lists & restores. |
| P5 | Panel slide animation. Hover effects. Keyboard shortcuts. Undo/redo. |

---

## Dependencies

| Package | Purpose | Install |
|---------|---------|---------|
| `@dnd-kit/core` | Drag and drop engine | `npm i @dnd-kit/core` |
| `@dnd-kit/sortable` | Sortable list for canvas blocks | `npm i @dnd-kit/sortable` |
| `@dnd-kit/utilities` | CSS transform utilities | `npm i @dnd-kit/utilities` |

No other new dependencies needed — uses existing Tailwind, shadcn/ui, hugeicons, Supabase client.

# Drag & Drop Email Editor — Implementation Plan

## Overview

Build a Postcards-style 4-panel drag-and-drop email editor that opens when a draft is selected. Loads existing `body_html` as a single editable canvas block (Approach A). Module templates use hardcoded structures with brand kit variables auto-applied (Option 3).

> [!IMPORTANT]
> The editor replaces the normal `DashboardLayout` sidebar with its own module panel layout. It needs a dedicated layout component.

> [!WARNING]
> **Role-based right sidebar**: Regular users see a **comments/annotations** panel. Superadmin/manager can **toggle** between the properties panel and their own separate comments view via a comment icon. User and admin comments are separate views.

---

## Architecture

```mermaid
graph LR
    A[DraftsPage / DashboardPage] -->|click draft| B[/dashboard/drafts/:id/edit]
    B --> C[EditorLayout]
    C --> D[ModuleSidebar - categories]
    C --> E[ModulePanel - variations]
    C --> F[EditorCanvas - drag & drop]
    C --> G{Role?}
    G -->|user| H[CommentsPanel - highlights + pins]
    G -->|superadmin| I[PropertiesPanel + comment toggle]
```

### 4-Panel Layout

| Panel | Width | Purpose |
|-------|-------|---------|
| **Module Sidebar** | 64px icon rail | Category icons: Menu, Header, Content, Donation Ask, CTA, P.S., Footer |
| **Module Panel** | 280px, slides in/out | Shows numbered template variations for the selected category |
| **Editor Canvas** | Flex remaining | Drop zone + rendered email preview |
| **Right Sidebar** | 300px | **Role-dependent** — see below |

#### Right Sidebar by Role

| Role | Default View | Toggle |
|------|-------------|--------|
| `user` | Comments/Annotations panel | N/A (comments only) |
| `manager` / `superadmin` | Properties panel (padding, font, etc.) | Comment icon toggles to admin comments view |

- The comment icon toggle is **only visible** to `manager` and `superadmin` roles
- User comments and admin comments are **separate threads** (users cannot see admin-side comments and vice versa)
- Annotations include both **text highlights** (like Google Docs) and **pin-based annotations** (numbered pins on the canvas)
- Comments support **threading** (replies) and **resolve** actions

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

### New Column: `auth.users` role

```sql
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
-- Possible values: 'user', 'manager', 'superadmin'
-- Manually assigned by app creator
```

> [!NOTE]
> If Supabase doesn't allow modifying `auth.users` directly, we'll use `user_metadata` or a `profiles` table with a `role` column instead.

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

### New Table: `draft_comments`

```sql
CREATE TABLE public.draft_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES public.email_drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.draft_comments(id) ON DELETE CASCADE,  -- threading
  comment_text TEXT NOT NULL,
  highlight_selector TEXT,          -- CSS selector or text range for highlight
  highlight_text TEXT,              -- the highlighted text snippet
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  view_scope TEXT NOT NULL DEFAULT 'user',  -- 'user' or 'admin'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### New Table: `draft_annotations`

```sql
CREATE TABLE public.draft_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES public.email_drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_number INT NOT NULL,           -- numbered pin (1, 2, 3...)
  position_x FLOAT NOT NULL,         -- % from left
  position_y FLOAT NOT NULL,         -- % from top
  comment_text TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  view_scope TEXT NOT NULL DEFAULT 'user',  -- 'user' or 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Purpose: `view_scope` separates user and admin comment threads. Users only query `view_scope = 'user'`, admins see `view_scope = 'admin'`.

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
- **Only rendered for `manager` / `superadmin` roles** (or when toggled to properties view)
- Phase 1: padding (4-sided), background color, width
- Mobile/Desktop preview toggle

##### [NEW] `src/components/editor/CommentsPanel.tsx`
- Right sidebar for comments and annotations
- **Rendered for `user` role by default**, accessible to admins via toggle
- Shows list of comments with highlighted text or pin reference
- Add comment form at bottom
- Thread expansion (click to reply)
- Resolve button per comment

##### [NEW] `src/hooks/useUserRole.ts`
- Hook that reads the user's role from `user_metadata` or profiles table
- Returns `{ role, isAdmin, isManager }` for gating UI

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

### Phase 3.5: Comments & Annotations
> Role-based right sidebar, text highlights, pin annotations, threaded comments

#### Files

##### [NEW] Supabase migrations
- `draft_comments` table (as defined in Data Model)
- `draft_annotations` table (as defined in Data Model)
- Add `role` to user profiles/metadata
- RLS policies: users see own `view_scope='user'` comments, admins see `view_scope='admin'`

##### [MODIFY] `src/components/editor/CommentsPanel.tsx`
- Full implementation with real Supabase queries
- List comments filtered by `view_scope` matching the current user's role
- Threaded replies (click reply → nested reply form)
- Resolve action (marks `resolved = true`, records `resolved_by`)
- Linked highlight comments: clicking a comment scrolls to / highlights the referenced text
- Linked pin comments: clicking a comment highlights the pin on canvas

##### [NEW] `src/components/editor/HighlightLayer.tsx`
- Overlay on `EditorCanvas` that renders yellow highlight ranges
- When user selects text, show "Add Comment" tooltip
- Clicking creates a new `draft_comments` row with `highlight_selector` + `highlight_text`

##### [NEW] `src/components/editor/PinLayer.tsx`
- Overlay on `EditorCanvas` for numbered pin annotations
- Click anywhere on canvas → drops a numbered pin
- Opens inline comment form attached to the pin
- Pins stored in `draft_annotations` with `position_x`, `position_y`

##### [MODIFY] `src/components/editor/EditorLayout.tsx`
- Add comment icon toggle button (only visible to `manager`/`superadmin`)
- Toggle switches right sidebar between `PropertiesPanel` and `CommentsPanel`
- For `user` role, right sidebar is always `CommentsPanel`

##### [MODIFY] `src/components/editor/EditorCanvas.tsx`
- Integrate `HighlightLayer` and `PinLayer` overlays
- Render highlights and pins from Supabase data

---

### Phase 5: Persistence
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

### Phase 6: Polish
> Animations, slide-in panel, hover effects, keyboard shortcuts

#### Enhancements

- **Module panel slide animation**: `transform: translateX()` with `transition` on open/close
- **Module hover previews**: scale-up and subtle glow on hover in module panel
- **Drop zone indicators**: animated dashed border pulse when dragging over canvas
- **Block selection**: subtle blue outline + floating action bar (move up, move down, duplicate, delete)
- **Keyboard shortcuts**: `Cmd+S` save, `Cmd+Z` undo, `Cmd+Shift+Z` redo, `Delete` remove block
- **Smooth transitions**: block reorder animations via `@dnd-kit` transitions
- **Loading skeleton**: shimmer skeleton while draft + brand kit load
- **Comment animations**: smooth slide-in for new comments, resolve checkmark animation

---

## Verification Plan

### Automated
- TypeScript `tsc --noEmit` after each phase
- Vite dev server hot reload testing

### Manual (per phase)
| Phase | Verification |
|-------|-------------|
| P1 | Click draft → editor loads with body_html in canvas. Drag module from panel → drops into canvas. Right sidebar shows properties (admin) or comments (user). |
| P2 | All 7 categories show variations. Modules render with user's brand colors/logo. |
| P3 | Edit text inline. Upload image. Edit button URL. Mobile preview works. |
| P3.5 | Highlight text → add comment. Drop pin → add annotation. Thread replies. Resolve comments. User/admin views are separated. |
| P5 | Save persists to Supabase. Auto-save triggers. Version history lists & restores. |
| P6 | Panel slide animation. Hover effects. Keyboard shortcuts. Undo/redo. |

---

## Dependencies

| Package | Purpose | Install |
|---------|---------|---------|
| `@dnd-kit/core` | Drag and drop engine | `npm i @dnd-kit/core` |
| `@dnd-kit/sortable` | Sortable list for canvas blocks | `npm i @dnd-kit/sortable` |
| `@dnd-kit/utilities` | CSS transform utilities | `npm i @dnd-kit/utilities` |

No other new dependencies needed — uses existing Tailwind, shadcn/ui, hugeicons, Supabase client.

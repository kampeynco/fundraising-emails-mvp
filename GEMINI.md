# GEMINI.md — Fundraising Emails Project Rules

## Always Do First
- **Invoke the `ui-ux-pro-max` skill** before writing any frontend code, every session, no exceptions.
- Read `.agent/skills/ui-ux-pro-max/SKILL.md` and follow its workflow: analyze requirements → generate design system → supplement with domain searches → apply stack guidelines.
- **Invoke the `direct-response-marketing-landing-page` skill** when building or reviewing the landing page. Read `.agent/skills/direct-response-marketing-landing-page/SKILLS.MD` and its `references/` folder before diagnosing, designing layout, or writing copy.

## Project Architecture
- **Framework**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Icons**: Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`) — **never use lucide-react**
- **Auth**: Supabase (magic link + email/password) via `AuthProvider` context
- **Routing**: React Router v6 with layout routes
- **Animation**: framer-motion (auth pages)
- **Node**: v20+ (pinned in `.nvmrc`)

## Local Server
- Start: `npm run dev` (Vite, serves at `http://localhost:5173`)
- Requires **Node 20+** — run `nvm use` to auto-select from `.nvmrc`.
- If the server is already running, do not start a second instance.

## MPA Structure
| Route | Entry | Purpose |
|---|---|---|
| `/` | `index.html` | Static landing page (Tailwind CDN) |
| `/login`, `/get-started`, `/dashboard/*` | `app.html` → React SPA | Dashboard app |

## Brand Colors
Landing page uses a custom Tailwind palette — apply these throughout:
- **Navy**: `#1a3a5c` (500), `#142d48` (600), `#0f2137` (700)
- **Coral**: `#e8614d` (accent)
- **Cream**: `#faf8f5` (background)

## Screenshot Workflow
- **Use the `browser_subagent` tool** to navigate to `http://localhost:5173` and capture screenshots.
- After capturing, analyze the screenshot directly via `view_file`.
- Check: spacing/padding, font size/weight, colors (exact hex), alignment, border-radius, shadows.

## Design Thinking
Before coding, understand the context and commit to a bold aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick a strong direction and commit fully.
- **Differentiation**: What makes this unforgettable?

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly.
- If no reference image: design from scratch with high craft.
- Use the `browser_subagent` to screenshot your output, compare against reference, fix mismatches. Do at least 2 comparison rounds.

## Brand Assets
- Check `brand_assets/` before designing. Use real assets over placeholders.

## Anti-Generic Guardrails

### Typography
- Never use generic fonts (Arial, Inter, Roboto, system fonts). Choose distinctive, characterful fonts.
- Pair a display/serif with a clean sans-serif. Apply tight tracking on large headings, generous line-height on body text.

### Color & Theme
- Never use default Tailwind palette (indigo-500, blue-600, etc.). Use the project's custom brand colors.

### Shadows & Depth
- Use layered, color-tinted shadows with low opacity. Surfaces should have a layering system.

### Motion & Animation
- Only animate `transform` and `opacity`. Never use `transition: all`.
- Prioritize CSS-only solutions. Use scroll-triggering and hover states that surprise.

### Interactive States
- Every clickable element needs `hover`, `focus-visible`, and `active` states.

## Hard Rules
- Do not use `transition: all`.
- Do not use generic AI-generated aesthetics.
- Do not use default Tailwind blue/indigo as primary color.
- Do not use lucide-react — use hugeicons exclusively.
- Do not use the native `<input type="color">` — use the custom `HexColorPickerField` component (`src/components/ui/hex-color-picker.tsx`) which uses `react-colorful` for a hex-only gradient picker popover.

## Agent Skills

### Available Skills
- **dr-landing-page**
  - Purpose: direct-response landing page layouts + copywriting
  - Path: `./.agent/skills/dr-landing-page/`

- **refactor-uiux**
  - Purpose: refactor code following best practices + UI/UX + styling/layout consistency
  - Path: `./.agent/skills/refactor-uiux/`
  - Diff standard: `./.agent/skills/refactor-uiux/references/refactor-diff-template.md`

### Rules
- If a skill has a `references/` directory, **read those files before** diagnosing, writing, refactoring, or changing UI/styling.
- Prefer behavior-preserving refactors unless a behavior change is explicitly requested.

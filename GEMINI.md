# GEMINI.md — Frontend Website Rules (Antigravity)

## Always Do First
- **Invoke the `ui-ux-pro-max` skill** before writing any frontend code, every session, no exceptions.
- Read `.agent/skills/ui-ux-pro-max/SKILL.md` and follow its workflow: analyze requirements → generate design system → supplement with domain searches → apply stack guidelines.
- **Invoke the `direct-response-marketing-landing-page` skill** when building or reviewing any landing page. Read `.agent/skills/direct-response-marketing-landing-page/SKILLS.MD` and its `references/` folder (frameworks, section library, color palettes, checklists) before diagnosing, designing layout, or writing copy.

## Design Thinking
Before coding, understand the context and commit to a bold aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick a strong direction — brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. Commit fully.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this unforgettable? What's the one thing someone will remember?

Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Use the `browser_subagent` to screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- **Use the `browser_subagent` tool** to navigate to `http://localhost:3000` and capture screenshots.
- Browser sessions are automatically recorded as WebP videos to the artifacts directory (`~/.gemini/antigravity/brain/<conversation-id>/`).
- After capturing, analyze the screenshot directly — Antigravity can see and compare images natively via `view_file`.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing
- For full-page captures, instruct the browser subagent to scroll and capture multiple viewports if needed.

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise.
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Use the `generate_image` tool to create real assets when placeholders aren't sufficient.
- Mobile-first responsive.

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails

### Typography
- Never use generic fonts (Arial, Inter, Roboto, system fonts). Choose distinctive, characterful fonts.
- Pair a display/serif with a clean sans-serif. Never use the same font for headings and body.
- Apply tight tracking (`letter-spacing: -0.03em`) on large headings, generous line-height (`1.7`) on body text.
- Vary font choices across projects — never converge on the same "safe" pick.

### Color & Theme
- Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive a full system from it.
- Use CSS custom properties or Tailwind config for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- Vary between light and dark themes across projects.

### Shadows & Depth
- Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

### Gradients & Texture
- Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- Use gradient meshes, noise textures, geometric patterns, layered transparencies for atmosphere.

### Motion & Animation
- Only animate `transform` and `opacity`. Never use `transition: all`.
- Use spring-style easing. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (`animation-delay`) creates more delight than scattered micro-interactions.
- Prioritize CSS-only solutions. Use scroll-triggering and hover states that surprise.

### Interactive States
- Every clickable element needs `hover`, `focus-visible`, and `active` states. No exceptions.

### Images
- Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- Use `generate_image` to create real assets instead of relying on placeholder boxes.

### Spatial Composition
- Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements.
- Generous negative space OR controlled density — both work when intentional.
- Use intentional, consistent spacing tokens — not random Tailwind steps.

## Available Antigravity Tools
When building frontend, leverage these tools:
- **`browser_subagent`** — Navigate pages, click elements, take screenshots, validate layouts.
- **`generate_image`** — Create UI mockups, icons, illustrations, and other visual assets.
- **`21st-dev-magic`** — Search and generate React UI components from the 21st.dev library (when building React apps).
- **`run_command`** — Start dev servers, install dependencies, run builds.

## Hard Rules
- Do not add sections, features, or content not in the reference.
- Do not "improve" a reference design — match it.
- Do not stop after one screenshot pass.
- Do not use `transition: all`.
- Do not use generic AI-generated aesthetics (purple gradients on white, cookie-cutter layouts).
- Do not use default Tailwind blue/indigo as primary color.
- Do not use the same fonts or color schemes across different projects.

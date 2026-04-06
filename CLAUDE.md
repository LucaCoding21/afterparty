# Afterparty — Shopify Hydrogen Storefront

## Stack
- React 18 + React Router 7 (file-based routing)
- Shopify Hydrogen 2026.1 + Storefront API (GraphQL)
- Vite + SSR (entry.server.tsx / entry.client.tsx)
- TypeScript
- Plain CSS (no Tailwind, no CSS-in-JS, no CSS Modules)

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check

## Project Structure
- `app/routes/` — file-based routes (pages)
- `app/components/` — shared React components
- `app/lib/` — utilities, GraphQL fragments, static data
- `app/styles/app.css` — **ALL component/page styles go here** (single global stylesheet)
- `app/styles/reset.css` — CSS reset and base typography
- `app/styles/home-buttons.css` — homepage button styles

## Styling Rules — READ THIS BEFORE ANY DESIGN WORK

### All styles go in `app/styles/app.css`
Do NOT create new CSS files. Do NOT add inline styles. Do NOT use style objects in JSX.
Every component and page is styled through classes defined in `app/styles/app.css`.

### Use CSS custom properties (variables)
Colors, fonts, and sizes are defined as CSS variables in `:root` at the top of `app.css`:
- Colors: `--color-dark`, `--color-light`
- Fonts: `--font-sans`
- Font sizes: `--font-display`, `--font-h1` through `--font-h6`, `--font-body`, `--font-small`, `--font-label`
- Layout: `--aside-width`, `--header-height`, `--grid-item-width`

Always use these variables instead of hardcoding values.

### Class naming convention
BEM-like pattern: `.component-name`, `.component-name-child`, `.component-name-child--modifier`
State classes: `.active`, `.expanded`, `.open`, `.selected`, `.disabled`, `.is-open`

### Responsive design
- Mobile-first approach
- Breakpoints at `45em` (~720px) and `48em` (~768px)
- Use `clamp()` for fluid typography (already set up in CSS variables)
- Media queries go in `app.css` near the relevant component styles

### When editing styles
1. First find the existing classes in `app.css` for the component you're changing
2. Modify those existing rules — don't duplicate or create parallel styles
3. New components: add styles to the end of the relevant section in `app.css`, following the comment-delimited section pattern

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

## SEO & Share Cards — READ BEFORE TOUCHING META TAGS

### No `og:description` or `twitter:description`. This is deliberate.
Do NOT add `og:description` or `twitter:description` to any page. Not as a "fix",
not as an SEO improvement, not because a link preview looks sparse. Share cards
are meant to read as **brand name + image only**.

If a share card renders with no body copy, that is the intended design, not a bug.
Do not diagnose it as one.

### `meta name="description"` is the exception, homepage only.
`app/root.tsx` DOES set `meta name="description"`. This is intentional and is not
a violation of the rule above. Without it Google synthesised its own snippet out
of the JSON-LD description plus scraped nav text, which rendered as
"...Limited drops and signature graphics Shop All ProductsTops & ShirtsOuterwear".
The tag exists to control that snippet.

It lives in `root.tsx` only, which reaches the homepage alone (every other route
exports its own meta via `seoTags()`, and in React Router 7 a leaf's meta replaces
its parent's). Do not push it site-wide: duplicate descriptions across pages are
ignored by Google anyway.

### `og:description` is declared EMPTY, not omitted. Do not "clean this up".
`root.tsx` emits `og:description` and `twitter:description` with `content: ''`.
This looks like dead code and is not. Meta's and X's crawlers fall back to
`meta name="description"` when `og:description` is *absent*, so deleting these
two lines would leak the Google copy onto the share card, which is exactly the
outcome the brand-name-plus-image rule exists to prevent. Declaring them empty
satisfies the crawler's lookup and suppresses the fallback.

Net effect: Google gets description text, social cards stay title + image only.

### Two description strings, deliberately NOT shared
`root.tsx` defines `metaDescription` and `orgDescription` separately. Do not
refactor them into one const "to avoid duplication". They target different
readers and are worded differently on purpose:

- `metaDescription` is **read by people** in the Google result snippet. Brand
  voice, current copy.
- `orgDescription` is **never rendered anywhere**. It feeds the Organization
  JSON-LD and Google's entity graph, so it front-loads the keywords the snippet
  copy drops: "streetwear", "Ho Chi Minh City (Saigon)", "Vietnam".

This matters because JSON-LD is not dormant. Before a meta description existed,
Google was literally printing `orgDescription`'s text as the search snippet and
padding it with scraped nav text. It is a live surface, so keep its geographic
and category keywords intact even as brand copy changes. `addressLocality:
Ho Chi Minh City` in the same block is the other half of that anchor.

### Where the tags live
- `app/root.tsx` — the homepage card only. Hand-rolled array, includes `og:locale`.
- `app/lib/seo.ts` — `seoTags()`, used by every other route.

These are two separate code paths. Changing one does NOT change the other. If you
are fixing the card people see when they share the bare domain, that is `root.tsx`.

### Rules for the image tags
- `og:image` must be **absolute**. Crawlers resolve it independently of the page
  they found it on, so a relative path (or a dev localhost origin) yields no image.
- Serve the fallback from `cdn.shopify.com`, not `/public`. Static files on the
  Oxygen origin answer GET with 200 but HEAD with 404, and unfurlers that probe
  with HEAD before downloading will skip the image. Keep the `?v=` cache key.
- `og:url` must be absolute. `canonical` stays relative on purpose.
- Only declare `og:image:width` / `og:image:height` when the real dimensions are
  known (the fallback is 1200x630). Product images vary in size, and declaring
  wrong dimensions is worse than declaring none.

### Debugging "the picture doesn't show when I share the link"
Check in this order before editing anything:
1. **Where is the link going?** Instagram only unfurls previews in DMs. Bio links,
   Story link stickers, captions, and comments never show a card. No tag change
   affects this.
2. **Is Meta's cache stale?** Meta caches a scrape per URL for weeks and Instagram
   reads the same cache as Facebook. Re-scrape at
   `https://developers.facebook.com/tools/debug/`. Do it for both the www and
   non-www forms, since the 301 means they are cached separately.
3. **Is it just the first share?** Without declared dimensions Meta fetches the
   image asynchronously and the first unfurl has no picture.

Verify the live output before assuming the markup is wrong:
`curl -sSL -A "facebookexternalhit/1.1" https://www.afterparty.space/ | grep -o '<meta[^>]*og:[^>]*>'`

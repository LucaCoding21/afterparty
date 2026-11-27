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

## Product photo and size guide spacing: APPROVED, DO NOT CHANGE

The owners signed off on the current product page photo sizing on 2026-10-05,
after many rounds of revisions, and the size guide spacing was changed to an
even 35px / 35px on 2026-11-26 at the user's request. Do not change these rules
in `app/styles/app.css`, not as a cleanup, a "consistency fix", or a side effect
of another task, unless the user explicitly asks for that exact change.

### Product photos (desktop, `min-width: 45em`)
Every photo, product shot or model, uses ONE frame (commit `dbb3d4c`):
- `.product-image`: `padding: 3rem 8rem`, `max-height: calc(100vh - var(--header-height) - 6rem)`
- `.product-image img`: `max-height: calc(100vh - var(--header-height) - 10rem)`, `object-position: center center`

Result: every photo sits 24px below the Back/Next row, all photos are the same
size, and nothing is cropped. Tablet (`48em` to `64em`) resets the frame padding
to `0` and shows photos edge to edge. Mobile is separate.

There is deliberately no separate frame for model photos anymore
(`.product-image-model` was removed). Do not reintroduce one, and do not give
product shots their own frame. Two different frames are what caused close-ups to
look jammed against the nav, model photos to jump when clicking through the
carousel, and a 2rem crop off the bottom of product shots.

### Size guides
Approved spacing (2026-11-26, replacing the 31px / 39px from 2026-10-05): the
drawing sits **35px below the table and 35px above Add to Cart**, even on every
product at every screen size. It is set once, as `--size-guide-gap` on
`.product-size-guide-photo` in `app.css`; the margins there subtract the table
line's inset (`100% / 441`) and the add-to-cart area's own 20px, so both visible
gaps equal the variable. Diagram height comes from its shape bucket
(`.product-size-guide-photo--wide/--square/--tall`).

**When the user sends a new chart (usually a rough screenshot of the
designer's chart), do the whole job without being asked step by step:**
1. Run `size-guide.py diagram` on the screenshot, then show the user the saved
   PNG (only the garment and its labels, no table, no edges).
2. Build the SVG table from the chart's numbers with `size-guide.py table`.
3. Add the `SIZE_GUIDE_MAP` entry. No CSS.
4. Run both checks below and build the preview. Report the gaps (35/35 at all
   6 sizes) and give the user the preview link.
If something blocks a clean result (blurry or small screenshot, grey table lines
the tool can't detect, numbers that are hard to read), say so instead of
guessing.

The gap is only even if the diagram PNG has no blank margin and no stray
specks, because the page measures from the image's edges. That is why every
diagram goes through the tool. Adding a size guide means adding files only,
never CSS:
- the SVG table, built with `python3 scripts/size-guide.py table ...` into
  `public/products/size-guides/` (never hand-written or copied and edited)
- the diagram PNG, made with `python3 scripts/size-guide.py diagram ...` into
  `public/products/measurements/`. Give it the designer's whole chart, even a
  rough screenshot with dark edges: it finds the white page, cuts away the size
  table, drops specks and crops tight. Never hand-crop.
- an entry in `SIZE_GUIDE_MAP` in `app/routes/products.$handle.tsx`, keyed by
  the exact Shopify handle

Checks, all of which must pass:
- `npm run check:size-guide-files` (`size-guide.py check`): files exist, tables
  in house format, diagrams tight with no specks. The pre-push hook in
  `.githooks/` runs it automatically on any push that touches size guides
  (`npm install` turns the hook on).
- `npm run check:size-guides -- --base http://localhost:<dev port>` with the dev
  server running: the file check, then `scripts/check-size-guide-gaps.cjs`,
  which measures the gap above and below every live product's drawing at
  1100, 1240, 1440, 1920, tablet 820 and phone 390, and fails if any side
  differs by more than 1px. `--out <dir>` saves screenshots and results.json.

Then always finish by building the old-vs-new preview with
`node scripts/size-guide-preview.mjs` and giving the user the private Artifact
link. The full steps, including what the designer hands over, are in section B
of `.claude/skills/launch-prep/SKILL.md`.

Known and separate: at 1100 and 1240 wide the product column is narrower than
the drawing, so drawings shrink and the (still even) gaps grow to 55-100px.
That is the photo sizing, not the gap; leave it unless asked.

### Long pants on catalog cards (desktop)
Catalog cards are square on desktop and zoom each photo to fill (`object-fit:
cover`), which crops long pants and makes them look oversized. Cards whose
product name contains pants, jeans, trousers or joggers (not shorts) get
`product-item--full-length` from `productItemClass()` in
`app/lib/productCard.ts`, and a desktop-only rule in `app.css` shows the whole
photo. Every card renderer uses `productItemClass()`; a new one must too.
- New pants need no CSS. Never add a per-product `[data-handle]` rule for this.
  If long pants have a name the rule misses, add the word to `FULL_LENGTH`.
- Whenever the user brings measurements or a size guide for new pants, check
  the title matches and look at the card on desktop (launch-prep step B4c).
- Phones: leave as is. The old per-product rules (Leopard, Velour, the two
  jeans) still set the phone look, and Classic Logo Sweatpants stays cropped on
  phones. The user approved this on 2026-11-26; don't "clean up" those rules.

### If a change seems to need these rules
Ask first. Then measure before and after, live site vs local, at several
desktop window sizes (for example 1240x880, 1440x900, 1920x1080, 1100x700) plus
tablet and mobile: gap below the nav, photo size, and pixels cropped.

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

## Free keycap gift — the discount lives in `shopify-app/`, not in Shopify admin's discount types

`shopify-app/` is a separate extension-only Shopify app (its own `package.json`,
excluded from the storefront's ESLint) holding one discount function,
`extensions/keycap-gift`. The "Free Nhím Keycap Clicker" automatic discount in
admin is backed by it. Do NOT recreate the gift as a native Buy X get Y
discount: BxGy allocates the "buy" units, which splits cart lines on every
quantity change, gives the split-off line a new id on every mutation (stale
Remove/+ buttons) and tags the qualifying items at checkout. The function
targets only the keycap line, so none of that happens.

- Rule: exactly one keycap unit free once the *other* lines qualify
  (800.000 VND in Vietnam, any amount elsewhere). Keycaps never count toward
  their own threshold. Defaults live in the function; the discount's
  `$app.function-configuration` metafield can override them.
- `KEYCAP_GIFT_THRESHOLD_VND` in `app/lib/keycapGift.ts` mirrors the function's
  VND threshold. Change both together.
- The storefront still adds/removes the gift line itself (`syncKeycapGift`, run
  inside the cart action and in the loaders); Shopify only prices a keycap that
  is already in the cart.
- Deploy changes with `cd shopify-app && shopify app deploy`. Tests:
  `cd shopify-app/extensions/keycap-gift && npm test`. Creating or editing the
  discount itself must be done as the keycap app (client-credentials token),
  not through `shopify store execute`; app discounts belong to the app that
  owns the function.

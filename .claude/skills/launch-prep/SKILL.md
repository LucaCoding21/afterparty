---
name: launch-prep
description: >-
  Prep new afterparty products for launch — audit a product's Shopify admin
  config, set up variants the house way (Color × Size), assign per-color
  images, and build/wire the custom SVG size-guide table + measurement photo.
  Use when the user mentions setting up new products, "MHZ"/collab drops, size
  guides, fitting tables, sizing charts, product variants, colors/sizes, or
  "getting products ready to launch / go public."
---

# Launch prep for afterparty products

A checklist-driven runbook for taking new (usually DRAFT) products from "uploaded
with photos" to "launch-ready." Two halves: **(A) Shopify admin variants/config**
and **(B) the file-based size-guide table**. They're independent — do either or both.

Store: `jstbkm-zd.myshopify.com`. All admin work uses the already-authed Shopify
CLI — see memory `reference_shopify_admin_cli.md`. The variant convention lives in
memory `project_product_variant_convention.md`; this skill is the executable flow.

## Guardrails — do NOT do these without explicit user say-so
- **Never set a product to Active / publish it.** Stock, going live, and channel
  publication are the owner's call. Leave status as-is unless told otherwise.
- **Never change inventory policy to oversell.** House default is `DENY`.
- **Confirm colors, prices, and which photo is which** with the user before
  building variants if there's any ambiguity. The image **alt text is the source
  of truth for colors** (see below) — trust it over a verbal "it's single color."
- Don't invent measurements. Read them off the size screenshot the user provides.

---

## A. Variants & admin config

### A1. Audit first (read-only) — report blockers before touching anything
Query the product(s) and report launch-readiness. One query gets most of it:

```bash
shopify store execute --store jstbkm-zd.myshopify.com \
  --query 'query { products(first:10, query:"handle:<glob>*") { nodes {
    handle title status onlineStoreUrl
    seo{title description} featuredImage{url} images(first:30){nodes{altText}}
    options{name position optionValues{name}}
    variants(first:50){nodes{ title price inventoryPolicy inventoryQuantity
      taxable availableForSale image{altText}
      inventoryItem{tracked requiresShipping measurement{weight{value unit}}}
      selectedOptions{name value} }}
    collections(first:10){nodes{handle}} } } }' \
  --output-file /tmp/audit.json --json
```

Readiness checklist to report:
- **Variants** — is it Color(pos1) × Size? (single `Title[Default Title]` or
  `Size`-only = WRONG, needs fixing — see A3.)
- **Inventory** — qty (usually 0 pre-launch is fine) and policy = `DENY`.
- **Status** — DRAFT vs Active (flag, don't change).
- **Sales channel** — `onlineStoreUrl: null` ⇒ not published. The storefront is
  **Hydrogen/headless**, so it must be published to that channel or the
  Storefront API won't return it even when Active. (CLI can't read/set the
  channel — the `publications` field needs a scope the connector lacks; flag it
  for the owner to do in admin.)
- **Images** — present? thin (1 image) products worth flagging.
- **SEO / SKUs** — empty is non-blocking (route falls back to title/description);
  flag as optional.
- Prices are in **VND** (e.g. 486000 = ₫486,000). Confirm they're intended.

### A2. The convention (match EVERY existing product)
- **Color is ALWAYS option position 1** — even single-color products
  (`horse-trucker-hat` = Color(1); `worlds-biggest-hater-baby-tee` = Color(1)×Size).
  Never set a product up Size-only.
- Apparel = **Color × Size** (Size pos 2; values `S/M/L/XL` or `S/M/L`).
  Hats = **Color only**, one size (no Size option).
- Colors come from the **image alt text** — each photo is tagged with its color
  name (e.g. `"Black"`, `"Forest Green"`, `"Black/Blue"`, `"Black/White"`). The
  distinct alts = the color list. A product with 4 alt-tagged colors is a 4-color
  product even if someone said "single color."
- Per color there are usually 2 flat-lays: **back/graphic** (the hero) and
  **front/logo**. Assign the **back/graphic** as the variant image (used for the
  color swatch + collection thumbnail). Hats: use the straight-on **front** shot.
- Variant defaults (copy from existing): same price across sizes,
  `inventoryPolicy: DENY`, `taxable: true`, `inventoryItem.tracked: true`,
  `requiresShipping: true`, weight `0 KILOGRAMS`, no SKU.

### A3. Build Color × Size (CLI sequence)
Use `--allow-mutations`. Pass big variant arrays via `--variable-file` (the CLI
takes no stdin/heredoc). Pattern, per product:

1. **Add Color at position 1** (existing variants inherit the first color):
   ```graphql
   productOptionsCreate(
     productId: "gid://shopify/Product/<id>",
     options: [{name:"Color", position:1, values:[{name:"<C1>"},{name:"<C2>"}]}],
     variantStrategy: LEAVE_AS_IS) { userErrors{field message code} ... }
   ```
   - Size-only product → existing S/M/L/XL become `<C1> / S..XL`.
   - `Title`-only product (hat) → the Default Title variant becomes `<C1>`; Title
     option is replaced.
   - If the product has no Size option yet and needs one, add Size the same way
     (`position:1`, then it shifts to 2 when Color is added — add Color first or
     give Size `position:2`).

2. **Bulk-create the remaining color × size combos** with image + config via
   `productVariantsBulkCreate(productId, variants)`. Each variant input:
   ```json
   {"optionValues":[{"optionName":"Color","name":"<C2>"},{"optionName":"Size","name":"M"}],
    "price":"<price>","inventoryPolicy":"DENY","taxable":true,
    "mediaId":"gid://shopify/MediaImage/<heroForC2>",
    "inventoryItem":{"tracked":true,"requiresShipping":true,
      "measurement":{"weight":{"value":0,"unit":"KILOGRAMS"}}}}
   ```

3. **Attach the hero image to the first color's variants** (created in step 1
   without an image) via `productVariantsBulkUpdate(productId, variants:[{id, mediaId}])`.

4. **Verify**: re-query and assert each variant's `image.altText` === its Color
   value, plus price/policy/qty. Don't stop until all match.

To get media IDs + alts: `media(first:30){nodes{... on MediaImage{id image{altText url}}}}`.
Download URLs to `/tmp` and Read them to pick the hero (back/graphic) per color.

---

## B. Size-guide table (file-based — NOT a Shopify metafield)

The fitting table is 100% front-end, keyed by **product handle** in
`SIZE_GUIDE_MAP` in `app/routes/products.$handle.tsx`. Shopify only supplies the
handle. Two assets per product:
- `sizeGuide`: an SVG table in `public/products/size-guides/`.
- `sizePhoto` (optional): the measurement diagram, in `public/products/measurements/`.

**Every table and diagram is made with `scripts/size-guide.py`. Never hand-write
an SVG or hand-crop a diagram.** The script holds the house format, so new guides
match the existing ones exactly with no measuring or nudging.

### B0. What the designer hands over (one folder per drop)
For each product, two exports named after the product title:
- `<Product Name> Chart <year>.png`: the full chart (diagram + table). This is
  where the numbers are read from.
- `<Product Name> Chart <year> 2.png` (or a second file with the same name):
  the diagram alone, no table. This becomes the `sizePhoto`.
Chart rules to check before building, and to send back to the designer if broken:
- Sizes are S/M/L, S/M/L/XL or ONE SIZE (the table supports 1, 3 or 4 sizes).
- 1 to 6 rows, values in cm, numbers only (half sizes like 22.5 are fine).
- Every measurement drawn on the diagram has a row in the table, and the other
  way round. (The Nov 2026 jeans drew "thigh" with no thigh row: flag that.)
- The diagram export is at least ~800px tall so it stays sharp on retina.
When two products measure identically and their diagrams are the same drawing,
they share one table and one diagram (e.g. `letter-tees.svg` for the Graffiti and
Mystic tees).

### B1. Build the table
Read the numbers off the full chart (zoom into it; the jeans text is small) and run:
```bash
python3 scripts/size-guide.py table <name> --sizes S,M,L,XL \
  --row "WIDTH=57,59,61,63" --row "LENGTH=65,67,69,71" --row "SLEEVE LENGTH=17,18,19,20"
```
`<name>` is the handle (or a shared name like `letter-tees`). Row labels in
CAPS, in the chart's order. Standard labels: tops WIDTH / LENGTH / SLEEVE LENGTH;
bottoms WAIST / RISE / THIGH / INSEAM / LENGTH / LEG OPENING.

### B2. Prepare the diagram
```bash
python3 scripts/size-guide.py diagram "<designer's diagram-only file>" "<Product Name> Chart <year>"
```
It crops to the drawing (the approved spacing assumes zero blank margin),
saves the PNG and prints the shape bucket (wide / square / tall) the page will
use and the `sizePhoto` path to paste. Diagram height on the page comes from
the bucket, so no CSS is ever needed.

### B3. Wire it
Add an entry keyed by the **exact** handle (a mismatch = silently no guide):
```ts
'<handle>': {
  sizeGuide: '/products/size-guides/<name>.svg',
  sizePhoto: '/products/measurements/<Product%20Name>%20Chart%20<year>.png',
},
```
Confirm the handle in Shopify (A1 audit) rather than guessing it from the title.

### B4. Check
```bash
python3 scripts/size-guide.py check   # every entry: files exist, house format, tight crop
npm run typecheck
```
### B4b. Always finish with a preview link (the user expects this every time)
With the dev server running, build the comparison page. Pair each new handle
with a live product of the same kind (tee → `afterparty-x-megahertz-logo-t-shirt`,
button jersey → `dragon-jersey`, flared pants → `leopard-flared-pants`,
straight/wide pants → `classic-logo-sweatpants`) and pass the designer's full
chart for each:
```bash
node scripts/size-guide-preview.mjs --out <scratchpad>/size-guide-preview \
  --pair "<new-handle>=<reference-handle>" --chart "<new-handle>=<full chart file>" ...
```
It renders the real product page at desktop 1440 and mobile 390 (drafts work,
because the new files are swapped into the reference product's page), measures
the gaps, and exits non-zero if any gap isn't 31px / 39px. Then publish
`<out>/index.html` with the Artifact tool, passing every file in `<out>/img` as
`files` (root = `<out>`), and give the user the private link. Look at the
screenshots before publishing; fix anything that looks off first.

### B5. Tee front/back ordering
Tees whose variant image is the **back/graphic** (logo on front) should show the
front first on the PDP — add the handle to `FRONT_FIRST_HANDLES` in
`DynamicProductPage` (e.g. the Nhím tees, MHZ logo tee). Ringer tees put the
graphic on the front (single flat-lay per color) and don't need it.

---

## Typical flow
1. User drops product photos (already uploaded to Shopify) + size screenshots.
2. **Audit** (A1) → report blockers.
3. Read the size screenshots and the product images; confirm colors/prices.
4. **Variants** (A3) → build Color × Size, verify.
5. **Size guide** (B) → `scripts/size-guide.py table` + `diagram`, wire
   `SIZE_GUIDE_MAP`, then `size-guide.py check`, typecheck, and the preview
   link (B4b).
6. Hand back the launch checklist (stock, set Active, publish to headless) — the
   owner does those.

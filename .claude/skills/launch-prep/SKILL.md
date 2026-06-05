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
- `sizeGuide`: a hand-built SVG in `public/products/size-guides/`.
- `sizePhoto` (optional): the measurement diagram the user gives, dropped in
  `public/products/measurements/` (URL-encode spaces as `%20`; keep `()` literal).

### B1. Wire it
Add an entry keyed by the **exact** handle (a mismatch = silently no guide):
```ts
'<handle>': {
  sizeGuide: '/products/size-guides/<name>.svg',
  sizePhoto: '/products/measurements/<Photo>%20(1).png',
},
```
Reuse an existing SVG/photo when the fit matches (e.g. both MHZ tees vs raglan;
the MHZ raglan reuses `raglan-tee.svg` + the raglan long-sleeve photo). Multiple
handles can point at the same files.

### B2. SVG geometry (house format — match exactly)
- `viewBox="0 0 441 H"` — **width always 441**; `H = 41 + 51 × <dataRows> + ~0.5`
  (3 rows → 196; 6 rows → 348).
- Horizontal divider `<line>`s at y = `0.5, 41, 92, 144, 195.5, 246.5, 297.5, 347.5…`
  (header band 41 tall, each data row ~51).
- Text baselines: header `y=26`; data rows `70, 121.5, 173.3, 224.5, 275.5, 326`.
- Label column at `x=14` (left-aligned), `fill="#111"`. Values `fill="#000"`,
  `text-anchor="middle"`. Font `'Inter var', 'Inter', sans-serif`.
- Column centers:
  - **3 sizes (S/M/L):** `141, 261, 381`.
  - **4 sizes (S/M/L/XL):** `161, 241, 321, 401` (label region 0–121).
  - **ONE SIZE:** single centered value at `x=275`.
- Note: CSS (`.product-size-guide-svg text`) forces `font-size: 0.7rem !important`
  and scales the 441 viewBox to the container — so the `font-size` attrs in the
  SVG are stripped/ignored; geometry (positions) is what matters.
- Rows are garment flat-lay measurements in **cm** (e.g. WIDTH / LENGTH /
  SLEEVE LENGTH; pants: WAIST / RISE / THIGH / INSEAM / LENGTH / LEG OPENING).
  Match the row labels and `cm` values to the user's screenshot exactly.

Fastest path: copy the closest existing SVG (e.g. `bubble-letter-ringer-tee.svg`
for a 4-size tee) and swap the numbers, labels, and column centers.

### B3. Tee front/back ordering
Tees whose variant image is the **back/graphic** (logo on front) should show the
front first on the PDP — add the handle to `FRONT_FIRST_HANDLES` in
`DynamicProductPage` (e.g. the Nhím tees, MHZ logo tee). Ringer tees put the
graphic on the front (single flat-lay per color) and don't need it.

### B4. Verify
`npm run typecheck`, confirm the photo file exists, and (if asked) run the dev
server to screenshot the PDP with the Size Guide dropdown open.

---

## Typical flow
1. User drops product photos (already uploaded to Shopify) + size screenshots.
2. **Audit** (A1) → report blockers.
3. Read the size screenshots and the product images; confirm colors/prices.
4. **Variants** (A3) → build Color × Size, verify.
5. **Size guide** (B) → create/reuse SVG, add measurement photo, wire
   `SIZE_GUIDE_MAP`, typecheck.
6. Hand back the launch checklist (stock, set Active, publish to headless) — the
   owner does those.

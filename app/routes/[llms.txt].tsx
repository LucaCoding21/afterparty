import type {Route} from './+types/[llms.txt]';

/**
 * /llms.txt — emerging convention (llmstxt.org) that lets AI agents discover
 * a site's structure and key facts in one fetch, the way they read robots.txt
 * for crawl rules. Markdown body. Listed bots: GPTBot, ClaudeBot, PerplexityBot,
 * Google-Extended, Applebot-Extended, CCBot.
 *
 * Pulls product + collection data live so it stays in sync with the catalog.
 */
export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const origin = url.origin;

  const {products, collections} = await context.storefront.query(LLMS_QUERY);

  const body = renderLlmsTxt({
    origin,
    products: products?.nodes ?? [],
    collections: collections?.nodes ?? [],
  });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

function renderLlmsTxt({
  origin,
  products,
  collections,
}: {
  origin: string;
  products: Array<{handle: string; title: string; description?: string | null}>;
  collections: Array<{handle: string; title: string; description?: string | null}>;
}): string {
  const productLines = products
    .map((p) => {
      const desc = (p.description ?? '').replace(/\s+/g, ' ').trim();
      const tail = desc ? `: ${desc.slice(0, 120)}` : '';
      return `- [${p.title}](${origin}/products/${p.handle})${tail}`;
    })
    .join('\n');

  const collectionLines = collections
    .map((c) => {
      const desc = (c.description ?? '').replace(/\s+/g, ' ').trim();
      const tail = desc ? `: ${desc.slice(0, 120)}` : '';
      return `- [${c.title}](${origin}/collections/${c.handle})${tail}`;
    })
    .join('\n');

  return `# afterparty

> afterparty is an independent streetwear brand based in Ho Chi Minh City (Saigon), Vietnam. We design and release limited-drop tees, jackets, pants, hats, and accessories with signature graphics, drawing on Vietnamese culture and contemporary streetwear.

## About
- [About](${origin}/pages/about): Brand story
- [Locations](${origin}/pages/stockists): Where to find us in person
- [Support and FAQ](${origin}/pages/support): Shipping, returns, contact

## Collections
${collectionLines}

## Products
${productLines}

## Contact
- Email: minh@afterparty.space
- Instagram: https://www.instagram.com/afterparty.space/
- Facebook: https://www.facebook.com/afterparty.space/
- Location: Ho Chi Minh City, Vietnam
- Ships from: Ho Chi Minh City, Vietnam (1 to 3 business days)

## Shipping
- Southeast Asia: 5 to 10 business days, from 8 USD
- Rest of world: 10 to 20 business days, from 15 USD
- Duties and taxes are the responsibility of the recipient

## Returns
- Refunds and exchanges are not offered once an order has shipped
- If an order has not shipped, contact minh@afterparty.space to cancel
- Damaged or incorrect orders: email minh@afterparty.space with order number and photos
`;
}

const LLMS_QUERY = `#graphql
  query LlmsCatalog($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 100) {
      nodes {
        handle
        title
        description
      }
    }
    collections(first: 50) {
      nodes {
        handle
        title
        description
      }
    }
  }
` as const;

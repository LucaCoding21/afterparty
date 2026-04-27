/**
 * Builds the standard set of head tags for a page: title, description, canonical,
 * Open Graph, and Twitter card. Each route's meta() spreads the result and
 * appends route-specific extras (preloads, JSON-LD, etc.).
 *
 * Pass `url` as a path (e.g. "/products/foo"); platforms accept relative
 * canonicals and og:urls, and we don't always have the absolute origin in
 * meta.
 */
export type SeoTagInput = {
  title: string;
  description: string;
  image?: string | null;
  url: string;
  type?: 'website' | 'product' | 'article';
};

export function seoTags({
  title,
  description,
  image,
  url,
  type = 'website',
}: SeoTagInput): any[] {
  const tags: any[] = [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: url},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:type', content: type},
    {property: 'og:url', content: url},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
  ];
  if (image) {
    tags.push({property: 'og:image', content: image});
    tags.push({name: 'twitter:image', content: image});
  }
  return tags;
}

/** Best-effort plain-text from HTML description, trimmed for meta tag length. */
export function stripHtml(html: string, max = 200): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

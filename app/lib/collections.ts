import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export type VariantItem = {
  id: string;
  handle: string;
  title: string;
  colorName?: string;
  selectedOptions?: {name: string; value: string}[];
  image?: string;
  price: MoneyV2;
  availableForSale: boolean;
  trackingParameters?: string;
};

/**
 * Flattens a list of Shopify products into per-color-variant grid items.
 * Products with multiple colors show one item per color (each with its variant image).
 * Single-color products show as one item.
 */
export function flattenToColorVariants(products: any[]): VariantItem[] {
  const items: VariantItem[] = [];
  for (const product of products) {
    const colorOption = product.options?.find(
      (o: any) => o.name.toLowerCase() === 'color',
    );
    if (colorOption && colorOption.values.length > 1) {
      const seen = new Set<string>();
      // Prefer the first *available* variant per color so links land on a buyable size
      const variants = product.variants?.nodes ?? [];
      const preferred = [
        ...variants.filter((v: any) => v.availableForSale),
        ...variants.filter((v: any) => !v.availableForSale),
      ];
      for (const variant of preferred) {
        const color = variant.selectedOptions?.find(
          (o: any) => o.name.toLowerCase() === 'color',
        )?.value;
        if (!color || seen.has(color)) continue;
        seen.add(color);
        items.push({
          id: `${product.id}-${color}`,
          handle: product.handle,
          title: product.title,
          colorName: color,
          selectedOptions: variant.selectedOptions,
          image: variant.image?.url,
          price: variant.price,
          availableForSale: variant.availableForSale,
          trackingParameters: product.trackingParameters,
        });
      }
    } else {
      const firstVariant = product.variants?.nodes?.[0];
      items.push({
        id: product.id,
        handle: product.handle,
        title: product.title,
        image:
          firstVariant?.image?.url ||
          product.featuredImage?.url ||
          product.selectedOrFirstAvailableVariant?.image?.url,
        price:
          firstVariant?.price ||
          product.priceRange?.minVariantPrice ||
          product.selectedOrFirstAvailableVariant?.price,
        availableForSale: product.availableForSale ?? firstVariant?.availableForSale ?? true,
        trackingParameters: product.trackingParameters,
      });
    }
  }
  return items;
}

/**
 * Builds a product detail URL that includes all variant options so
 * `selectedOrFirstAvailableVariant` matches the correct variant server-side.
 * Passing only partial options (e.g. `Color=White`) falls back to the
 * product's first variant regardless of color.
 */
export function buildProductUrl(item: VariantItem, fromKey?: string): string {
  const params = new URLSearchParams();
  if (item.selectedOptions?.length) {
    for (const opt of item.selectedOptions) params.set(opt.name, opt.value);
  } else if (item.colorName) {
    params.set('Color', item.colorName);
  }
  if (fromKey) params.set('from', fromKey);
  const qs = params.toString();
  return qs ? `/products/${item.handle}?${qs}` : `/products/${item.handle}`;
}

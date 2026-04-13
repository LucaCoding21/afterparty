export type VariantItem = {
  id: string;
  handle: string;
  title: string;
  colorName?: string;
  image?: string;
  price: {amount: string; currencyCode: string};
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
      for (const variant of product.variants?.nodes ?? []) {
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

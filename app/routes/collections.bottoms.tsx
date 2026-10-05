import {useEffect} from 'react';
import type {Route} from './+types/collections.bottoms';
import {Link, useLoaderData} from 'react-router';
import {Price} from '~/components/Price';
import {flattenToColorVariants, buildProductUrl} from '~/lib/collections';
import {shopifyImg, shopifySrcSet} from '~/lib/images';

// The Shopify collection is being renamed from handle "pants" to "bottoms".
// Ask for both so the page keeps its products whichever one exists in admin.
// Once the handle is "bottoms", the pants lookup can be removed.
export async function loader({context}: Route.LoaderArgs) {
  const {bottoms, pants} = await context.storefront.query(COLLECTION_QUERY, {
    cache: context.storefront.CacheLong(),
  });
  const collection = bottoms ?? pants;
  return {items: flattenToColorVariants(collection?.products?.nodes ?? [])};
}

const COLLECTION_QUERY = `#graphql
  query BottomsCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    bottoms: collection(handle: "bottoms") {
      ...BottomsCollectionProducts
    }
    pants: collection(handle: "pants") {
      ...BottomsCollectionProducts
    }
  }
  fragment BottomsCollectionProducts on Collection {
    products(first: 50, sortKey: CREATED, reverse: true) {
      nodes {
        id
        handle
        title
        availableForSale
        featuredImage { url }
        options { name values }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 20) {
          nodes {
            id
            availableForSale
            selectedOptions { name value }
            image { url }
            price { amount currencyCode }
          }
        }
      }
    }
  }
` as const;

export default function Bottoms() {
  const {items} = useLoaderData<typeof loader>();
  useEffect(() => {
    sessionStorage.setItem('lastCategoryPath', '/collections/bottoms');
    sessionStorage.setItem('lastCategoryName', 'Bottoms');
    sessionStorage.setItem('lastCategoryProducts', JSON.stringify(items.map((i) => i.handle)));
  }, [items]);
  return (
    <div className="collection">
      <h1 className="collection-title">Bottoms</h1>
      <div className="products-grid">
        {items.map((item, index) => (
          <Link
            key={item.id}
            className="product-item"
            prefetch="intent"
            to={buildProductUrl(item)}
            data-handle={item.handle}
          >
            <div className="product-item-img">
              {item.image && (
                <img
                  src={shopifyImg(item.image, {width: 800})}
                  srcSet={shopifySrcSet(item.image, [400, 600, 800, 1200])}
                  sizes="(min-width: 45em) 25vw, 50vw"
                  alt={item.title}
                  loading={index < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              )}
            </div>
            <h4>{item.title}</h4>
            <small>
              {!item.availableForSale ? 'SOLD OUT' : <Price data={item.price} />}
            </small>
          </Link>
        ))}
      </div>
    </div>
  );
}

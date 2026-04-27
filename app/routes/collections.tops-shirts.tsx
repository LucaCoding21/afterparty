import {useEffect} from 'react';
import type {Route} from './+types/collections.tops-shirts';
import {Link, useLoaderData} from 'react-router';
import {Money} from '@shopify/hydrogen';
import {flattenToColorVariants, buildProductUrl} from '~/lib/collections';
import {shopifyImg, shopifySrcSet} from '~/lib/images';

export async function loader({context}: Route.LoaderArgs) {
  const {collection} = await context.storefront.query(COLLECTION_QUERY, {
    variables: {handle: 'tops-shirts'},
    cache: context.storefront.CacheLong(),
  });
  return {items: flattenToColorVariants(collection?.products?.nodes ?? [])};
}

const COLLECTION_QUERY = `#graphql
  query TopsShirtsCollection($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 50) {
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
  }
` as const;

export default function TopsShirts() {
  const {items} = useLoaderData<typeof loader>();
  useEffect(() => {
    sessionStorage.setItem('lastCategoryPath', '/collections/tops-shirts');
    sessionStorage.setItem('lastCategoryName', 'Tops & Shirts');
    sessionStorage.setItem('lastCategoryProducts', JSON.stringify(items.map((i) => i.handle)));
  }, [items]);
  return (
    <div className="collection">
      <h1 className="collection-title">Tops &amp; Shirts</h1>
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
              {!item.availableForSale ? 'SOLD OUT' : <Money data={item.price} />}
            </small>
          </Link>
        ))}
      </div>
    </div>
  );
}

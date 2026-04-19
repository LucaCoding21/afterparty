import {useEffect} from 'react';
import type {Route} from './+types/collections.pants';
import {Link, useLoaderData} from 'react-router';
import {Money} from '@shopify/hydrogen';
import {flattenToColorVariants, buildProductUrl} from '~/lib/collections';
import {shopifyImg} from '~/lib/images';

export async function loader({context}: Route.LoaderArgs) {
  const {collection} = await context.storefront.query(COLLECTION_QUERY, {
    variables: {handle: 'pants'},
  });
  return {items: flattenToColorVariants(collection?.products?.nodes ?? [])};
}

const COLLECTION_QUERY = `#graphql
  query PantsCollection($handle: String!) {
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
          variants(first: 50) {
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

export default function Pants() {
  const {items} = useLoaderData<typeof loader>();
  useEffect(() => {
    sessionStorage.setItem('lastCategoryPath', '/collections/pants');
    sessionStorage.setItem('lastCategoryName', 'Pants');
    sessionStorage.setItem('lastCategoryProducts', JSON.stringify(items.map((i) => i.handle)));
  }, [items]);
  return (
    <div className="collection">
      <h1 className="collection-title">Pants</h1>
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
                <img src={shopifyImg(item.image, {width: 800, format: 'webp'})} alt={item.title} loading={index < 4 ? 'eager' : 'lazy'} />
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

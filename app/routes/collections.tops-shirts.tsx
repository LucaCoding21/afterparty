import type {Route} from './+types/collections.tops-shirts';
import {Link, useLoaderData} from 'react-router';
import {Money} from '@shopify/hydrogen';
import {flattenToColorVariants} from '~/lib/collections';

export async function loader({context}: Route.LoaderArgs) {
  const {collection} = await context.storefront.query(COLLECTION_QUERY, {
    variables: {handle: 'tops-shirts'},
  });
  return {items: flattenToColorVariants(collection?.products?.nodes ?? [])};
}

const COLLECTION_QUERY = `#graphql
  query TopsShirtsCollection($handle: String!) {
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

export default function TopsShirts() {
  const {items} = useLoaderData<typeof loader>();
  return (
    <div className="collection">
      <h1 className="collection-title">Tops &amp; Shirts</h1>
      <div className="products-grid">
        {items.map((item, index) => (
          <Link
            key={item.id}
            className="product-item"
            prefetch="intent"
            to={
              item.colorName
                ? `/products/${item.handle}?Color=${encodeURIComponent(item.colorName)}`
                : `/products/${item.handle}`
            }
            data-handle={item.handle}
          >
            <div className="product-item-img">
              {item.image && (
                <img src={item.image} alt={item.title} loading={index < 4 ? 'eager' : 'lazy'} />
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

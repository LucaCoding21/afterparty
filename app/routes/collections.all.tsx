import {useEffect} from 'react';
import type {Route} from './+types/collections.all';
import {Link, useLoaderData} from 'react-router';
import {Money} from '@shopify/hydrogen';
import {flattenToColorVariants} from '~/lib/collections';

export async function loader({context}: Route.LoaderArgs) {
  const {products} = await context.storefront.query(CATALOG_QUERY);
  return {items: flattenToColorVariants(products.nodes)};
}

const CATALOG_QUERY = `#graphql
  query Catalog {
    products(first: 50) {
      nodes {
        id
        handle
        title
        availableForSale
        featuredImage {
          url
        }
        options {
          name
          values
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 50) {
          nodes {
            id
            availableForSale
            selectedOptions {
              name
              value
            }
            image {
              url
            }
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
` as const;

export default function ShopAll() {
  const {items} = useLoaderData<typeof loader>();
  useEffect(() => {
    sessionStorage.setItem('lastCategoryPath', '/collections/all');
    sessionStorage.setItem('lastCategoryName', 'All');
    sessionStorage.setItem('lastCategoryProducts', JSON.stringify(items.map((i) => i.handle)));
  }, [items]);

  return (
    <div className="collection">
      <h1 className="collection-title">All Products</h1>
      <div className="products-grid">
        {items.map((item, index) => (
          <Link
            key={item.id}
            className="product-item"
            prefetch="intent"
            to={
              item.colorName
                ? `/products/${item.handle}?Color=${encodeURIComponent(item.colorName)}&from=all`
                : `/products/${item.handle}?from=all`
            }
            data-handle={item.handle}
          >
            <div className="product-item-img">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  loading={index < 4 ? 'eager' : 'lazy'}
                />
              )}
            </div>
            <h4>{item.title}</h4>
            <small>
              {!item.availableForSale ? 'SOLD OUT' : (
                <Money data={item.price} />
              )}
            </small>
          </Link>
        ))}
      </div>
    </div>
  );
}

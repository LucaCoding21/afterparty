import type {Route} from './+types/collections.all';
import {Link, useLoaderData} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {COLLECTION_ITEMS} from '~/lib/staticProducts';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Afterparty | Shop All'}];
};

export async function loader({context}: Route.LoaderArgs) {
  const {products} = await context.storefront.query(CATALOG_QUERY);
  return {products: products.nodes};
}

const CATALOG_QUERY = `#graphql
  query Catalog {
    products(first: 8) {
      nodes {
        id
        handle
        title
        featuredImage {
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;

export default function ShopAll() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <div className="collection">
      <div className="products-grid">
        {products.map((product, index) => (
          <Link
            key={product.id}
            className="product-item"
            prefetch="intent"
            to={`/products/${product.handle}`}
          >
            <div className="product-item-img">
              {product.featuredImage && (
                <Image
                  alt={product.featuredImage.altText || product.title}
                  data={product.featuredImage}
                  loading={index < 4 ? 'eager' : undefined}
                  sizes="(min-width: 45em) 400px, 100vw"
                />
              )}
            </div>
            <h4>{product.title}</h4>
            <small>
              <Money data={product.priceRange.minVariantPrice} />
            </small>
          </Link>
        ))}
        {COLLECTION_ITEMS.map((item) => (
          <Link
            key={item.id}
            className="product-item"
            prefetch="intent"
            to={
              item.colorKey
                ? `/products/${item.parentHandle}?color=${item.colorKey}`
                : `/products/${item.parentHandle}`
            }
          >
            <div className="product-item-img">
              <img src={item.image} alt={item.displayTitle} loading="lazy" />
            </div>
            <h4>{item.displayTitle}</h4>
            <small>{item.price}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}

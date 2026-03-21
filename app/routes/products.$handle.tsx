import {useState, useEffect} from 'react';
import {
  useLoaderData,
  Link,
  useSearchParams,
} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  STATIC_PRODUCTS,
  STATIC_PRODUCTS_MAP,
  type StaticProduct,
  type ColorVariant,
} from '~/lib/staticProducts';

export const meta: Route.MetaFunction = ({data}) => {
  const title = data?.staticProduct
    ? data.staticProduct.title
    : data?.product?.title ?? '';
  return [
    {title: `Afterparty | ${title}`},
    {
      rel: 'canonical',
      href: `/products/${data?.staticProduct?.handle ?? data?.product?.handle}`,
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({
  context,
  params,
  request,
}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
  ]);

  if (product?.id) {
    redirectIfHandleIsLocalized(request, {handle, data: product});
    return {product, staticProduct: null};
  }

  // Fall back to static product catalog
  const staticProduct = STATIC_PRODUCTS_MAP[handle] ?? null;
  if (staticProduct) {
    return {product: null, staticProduct};
  }

  throw new Response(null, {status: 404});
}

function loadDeferredData({context, params}: Route.LoaderArgs) {
  return {};
}

export default function Product() {
  const data = useLoaderData<typeof loader>();

  if (data.staticProduct) {
    return <StaticProductPage product={data.staticProduct} />;
  }

  return <DynamicProductPage product={data.product!} />;
}

function useRecentlyViewed(currentHandle: string) {
  const [items, setItems] = useState<StaticProduct[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('ap-recently-viewed');
    const handles: string[] = stored ? JSON.parse(stored) : [];
    const updated = [currentHandle, ...handles.filter((h) => h !== currentHandle)].slice(0, 10);
    localStorage.setItem('ap-recently-viewed', JSON.stringify(updated));
    const products = updated
      .filter((h) => h !== currentHandle)
      .map((h) => STATIC_PRODUCTS_MAP[h])
      .filter(Boolean) as StaticProduct[];
    setItems(products);
  }, [currentHandle]);

  return items;
}

function ProductCard({product}: {product: StaticProduct}) {
  const firstColor = product.colors[0];
  return (
    <Link
      to={`/products/${product.handle}`}
      className="product-item"
      prefetch="intent"
    >
      <div className="product-item-img">
        <img src={firstColor.image} alt={product.title} loading="lazy" />
      </div>
      <h4>{product.title}</h4>
      <small>{product.price}</small>
    </Link>
  );
}

function ShopOthers({currentHandle, excludeHandles = []}: {currentHandle: string; excludeHandles?: string[]}) {
  const excluded = new Set([currentHandle, ...excludeHandles]);
  const others = STATIC_PRODUCTS.filter((p) => !excluded.has(p.handle)).slice(0, 4);
  if (others.length === 0) return null;
  return (
    <section className="product-related-section">
      <h2 className="product-related-heading">Shop Others</h2>
      <div className="product-related-grid">
        {others.map((p) => (
          <ProductCard key={p.handle} product={p} />
        ))}
      </div>
    </section>
  );
}

function RecentlyViewed({items}: {items: StaticProduct[]}) {
  if (items.length === 0) return null;
  return (
    <section className="product-related-section">
      <h2 className="product-related-heading">Recently Viewed</h2>
      <div className="product-related-grid">
        {items.map((p) => (
          <ProductCard key={p.handle} product={p} />
        ))}
      </div>
    </section>
  );
}

function Breadcrumb({title}: {title: string}) {
  return (
    <nav className="product-breadcrumb" aria-label="Breadcrumb">
      <Link to="/collections/all" className="breadcrumb-link">Shop All</Link>
      <span className="breadcrumb-sep">/</span>
      <span className="breadcrumb-current">{title}</span>
    </nav>
  );
}

function DynamicProductPage({product}: {product: NonNullable<any>}) {
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;
  const recentlyViewedItems = useRecentlyViewed(product.handle);
  const recentlyViewedHandles = recentlyViewedItems.map((p) => p.handle);

  return (
    <div className="product-page">
      <Breadcrumb title={title} />

      <div className="product">
        <ProductImage image={selectedVariant?.image} />
        <div className="product-main">
          <h1 className="product-title">{title}</h1>
          <div className="product-price-wrap">
            <ProductPrice
              price={selectedVariant?.price}
              compareAtPrice={selectedVariant?.compareAtPrice}
            />
          </div>
          <ProductForm
            productOptions={productOptions}
            selectedVariant={selectedVariant}
          />
          {descriptionHtml && (
            <div className="product-description">
              <p className="product-description-label">Description</p>
              <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
            </div>
          )}
        </div>
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />

      <RecentlyViewed items={recentlyViewedItems} />
      <ShopOthers currentHandle={product.handle} excludeHandles={recentlyViewedHandles} />
    </div>
  );
}

const SIZES = ['S', 'M', 'L'];

function StaticProductPage({product}: {product: StaticProduct}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const colorKey = searchParams.get('color');
  const selectedColor: ColorVariant =
    product.colors.find((c) => c.key === colorKey) ?? product.colors[0];
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const recentlyViewedItems = useRecentlyViewed(product.handle);
  const recentlyViewedHandles = recentlyViewedItems.map((p) => p.handle);

  function selectColor(color: ColorVariant) {
    if (product.colors.length > 1) {
      setSearchParams({color: color.key}, {preventScrollReset: true});
    }
  }

  return (
    <div className="product-page">
      <Breadcrumb title={product.title} />

      <div className="product">
        {/* Image column: flat lay first, model as secondary */}
        <div className="product-image-col">
          <div className="product-image">
            <img
              src={selectedColor.image}
              alt={`${product.title}${product.colors.length > 1 ? ` — ${selectedColor.name}` : ''}`}
              key={selectedColor.image}
            />
          </div>
          {selectedColor.modelImage && (
            <div className="product-image product-image-secondary">
              <img
                src={selectedColor.modelImage}
                alt={`${product.title} — model`}
                key={selectedColor.modelImage}
              />
            </div>
          )}
        </div>

        <div className="product-main">
          <h1 className="product-title">{product.title}</h1>
          <div className="product-price-wrap">
            <div className="product-price">{product.price}</div>
          </div>

          {product.colors.length > 1 && (
            <div className="product-options">
              <h5>
                Color: <span style={{color: '#000', fontWeight: 500, textTransform: 'none', letterSpacing: 0}}>{selectedColor.name}</span>
              </h5>
              <div className="product-color-swatches">
                {product.colors.map((color) => (
                  <button
                    key={color.key}
                    type="button"
                    className={`product-color-swatch${color.key === selectedColor.key ? ' selected' : ''}`}
                    aria-label={color.name}
                    title={color.name}
                    onClick={() => selectColor(color)}
                  >
                    <img src={color.image} alt={color.name} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-options">
            <h5>Size{selectedSize && `: `}{selectedSize && <span style={{color: '#000', fontWeight: 500, textTransform: 'none', letterSpacing: 0}}>{selectedSize}</span>}</h5>
            <div className="product-options-grid">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`product-options-item${selectedSize === size ? ' selected' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="product-description">
            <p className="product-description-label">Description</p>
            <div>
              <p>{product.description}</p>
            </div>
          </div>

          {/* Size guide */}
          {product.sizeGuide && (
            <details className="product-size-guide">
              <summary>
                Size Guide
                <svg className="product-size-guide-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 4.5l4 4 4-4" />
                </svg>
              </summary>
              <div className="product-size-guide-content">
                <img src={product.sizeGuide} alt="Size Guide" />
                {product.sizePhoto && (
                  <div className="product-size-guide-photo">
                    <img src={product.sizePhoto} alt="Measurement Reference" />
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="product-form">
            <button type="submit">Add to Cart</button>
          </div>
        </div>
      </div>

      <RecentlyViewed items={recentlyViewedItems} />
      <ShopOthers currentHandle={product.handle} excludeHandles={recentlyViewedHandles} />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

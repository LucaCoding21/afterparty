import {useState, useEffect, useLayoutEffect, useRef, useMemo} from 'react';
import {
  useLoaderData,
  Link,
  useNavigate,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  Money,
} from '@shopify/hydrogen';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {shopifyImg, preloadCartThumbnail, shopifySrcSet, preloadImage} from '~/lib/images';
import {seoTags, stripHtml} from '~/lib/seo';

const CAROUSEL_WIDTHS = [600, 900, 1200, 1600, 2000];
const CAROUSEL_SIZES = '(min-width: 45em) 50vw, 100vw';
const GRID_WIDTHS = [400, 600, 800, 1200];
const GRID_SIZES = '(min-width: 45em) 25vw, 50vw';

type CatalogProduct = {handle: string; title: string; image: string; price?: {amount: string; currencyCode: string}};

function useRecentlyViewed(currentHandle: string, currentTitle: string, currentImage: string, currentPrice?: {amount: string; currencyCode: string}) {
  const [recentlyViewed, setRecentlyViewed] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    const KEY = 'recentlyViewed';
    let items: CatalogProduct[] = [];
    try {
      items = JSON.parse(sessionStorage.getItem(KEY) || '[]') as CatalogProduct[];
    } catch {}

    // Show previously viewed products (excluding current)
    setRecentlyViewed(items.filter((p) => p.handle !== currentHandle).slice(0, 4));

    // Add current product to the list
    const updated = [
      {handle: currentHandle, title: currentTitle, image: currentImage, price: currentPrice},
      ...items.filter((p) => p.handle !== currentHandle),
    ].slice(0, 10);
    sessionStorage.setItem(KEY, JSON.stringify(updated));
  }, [currentHandle, currentTitle, currentImage, currentPrice]);

  return recentlyViewed;
}

// Maps both static and Shopify handles to size guide assets
const SIZE_GUIDE_MAP: Record<string, {sizeGuide: string; sizePhoto?: string}> = {
  'bubble-letter-ringer-tee': {
    sizeGuide: '/products/size-guides/bubble-letter-ringer-tee.svg',
    sizePhoto: '/products/measurements/Ringer%20Short%20Sleeve%20Tee%20Chart%201.png',
  },
  'leopard-flared-pants': {
    sizeGuide: '/products/size-guides/leopard-flared-pants.svg',
    sizePhoto: '/products/measurements/Leopard%20Flared%20Pants%20Chart%201.png',
  },
  'leopard-jacket': {
    sizeGuide: '/products/size-guides/leopard-jacket.svg',
    sizePhoto: '/products/measurements/Leopard%20Work%20Jacket%20Chart%201.png',
  },
  'leopard-work-jacket': {
    sizeGuide: '/products/size-guides/leopard-jacket.svg',
    sizePhoto: '/products/measurements/Leopard%20Work%20Jacket%20Chart%201.png',
  },
  'leopard-shorts': {
    sizeGuide: '/products/size-guides/leopard-shorts.svg',
    sizePhoto: '/products/measurements/Leopard%20Short%20Pants%20Charts%201.png',
  },
  'nhim-long-sleeve-tees': {
    sizeGuide: '/products/size-guides/nhim-long-sleeve-tees.svg',
    sizePhoto: '/products/measurements/2026-nhim-long-sleeve-tee-chart-1.png',
  },
  'nhim-long-sleeve-tee': {
    sizeGuide: '/products/size-guides/nhim-long-sleeve-tees.svg',
    sizePhoto: '/products/measurements/2026-nhim-long-sleeve-tee-chart-1.png',
  },
  'dog-failure-tee': {
    sizeGuide: '/products/size-guides/dog-failure-tee.svg',
  },
  'dog-screw-hoodie': {
    sizeGuide: '/products/size-guides/dog-screw-hoodie.svg',
    sizePhoto: '/products/measurements/Hoodie%20Size%20Chart%201.png',
  },
  'dragon-jersey': {
    sizeGuide: '/products/size-guides/dragon-jersey.svg',
    sizePhoto: '/products/measurements/Jersey%20Size%20Chart%201.png',
  },
  'hater-baby-tee': {
    sizeGuide: '/products/size-guides/hater-baby-tee.svg',
    sizePhoto: '/products/measurements/2025%20Hater%20Baby%20Tee%20Size%20Chart%201.png',
  },
  'worlds-biggest-hater-baby-tee': {
    sizeGuide: '/products/size-guides/hater-baby-tee.svg',
    sizePhoto: '/products/measurements/2025%20Hater%20Baby%20Tee%20Size%20Chart%201.png',
  },
  'hater-tee': {
    sizeGuide: '/products/size-guides/hater-tee.svg',
    sizePhoto: '/products/measurements/2025%20Hater%20Oversized%20Short%20Sleeve%20Boxy%20Tee%20Chart%201.png',
  },
  'world-biggest-hater-oversized-tee': {
    sizeGuide: '/products/size-guides/hater-tee.svg',
    sizePhoto: '/products/measurements/2025%20Hater%20Oversized%20Short%20Sleeve%20Boxy%20Tee%20Chart%201.png',
  },
  'horse-trucker-hat': {
    sizeGuide: '/products/size-guides/horse-trucker-hat.svg',
  },
  'nhim-tees': {
    sizeGuide: '/products/size-guides/nhim-tees.svg',
    sizePhoto: '/products/measurements/2026-nhim-short-sleeve-tee-chart-1.png',
  },
  'nhim-short-sleeve-tee': {
    sizeGuide: '/products/size-guides/nhim-tees.svg',
    sizePhoto: '/products/measurements/2026-nhim-short-sleeve-tee-chart-1.png',
  },
  'velour-track-jacket': {
    sizeGuide: '/products/size-guides/leopard-jacket.svg',
    sizePhoto: '/products/measurements/Velour%20Track%20Jacket%20Chart%201.png',
  },
  'velour-track-pants': {
    sizeGuide: '/products/size-guides/leopard-flared-pants.svg',
    sizePhoto: '/products/measurements/Velour%20Track%20Pants%20Chart%201.png',
  },
};

export const meta: Route.MetaFunction = ({data}) => {
  const product = data?.product as any;
  if (!product) return [{title: 'afterparty'}];

  const variant = product.selectedOrFirstAvailableVariant;
  const heroUrl: string | undefined = variant?.image?.url;
  const url = `/products/${product.handle}`;
  const title =
    product.seo?.title || `${product.title} — afterparty`;
  const description =
    product.seo?.description ||
    stripHtml(product.descriptionHtml ?? product.description ?? '') ||
    `Shop ${product.title} from afterparty — streetwear from Vietnam.`;

  const tags: any[] = seoTags({
    title,
    description,
    image: heroUrl,
    url,
    type: 'product',
  });

  if (heroUrl) {
    tags.push({
      tagName: 'link',
      rel: 'preload',
      as: 'image',
      imageSrcSet: shopifySrcSet(heroUrl, [600, 900, 1200, 1600, 2000]),
      imageSizes: '(min-width: 45em) 50vw, 100vw',
      fetchPriority: 'high',
    });
  }

  // Product structured data — lets Google show rich product cards (image,
  // price, in-stock badge) in search results.
  tags.push({
    'script:ld+json': {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description,
      image: heroUrl,
      sku: variant?.sku || undefined,
      brand: {'@type': 'Brand', name: 'afterparty'},
      offers: variant
        ? {
            '@type': 'Offer',
            price: variant.price?.amount,
            priceCurrency: variant.price?.currencyCode,
            availability: variant.availableForSale
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url,
          }
        : undefined,
    },
  });

  // Breadcrumb hierarchy — Home > Shop All > Product. Helps AI agents and
  // Google understand category context.
  tags.push({
    'script:ld+json': {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Home', item: '/'},
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Shop All',
          item: '/collections/all-products',
        },
        {'@type': 'ListItem', position: 3, name: product.title, item: url},
      ],
    },
  });

  return tags;
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
      cache: storefront.CacheLong(),
    }),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  const sizeGuideInfo = SIZE_GUIDE_MAP[handle] ?? null;
  return {product, sizeGuideInfo};
}

function loadDeferredData({context, params}: Route.LoaderArgs) {
  return {};
}

export default function Product() {
  const data = useLoaderData<typeof loader>();

  const sizeGuideInfo = (data as {sizeGuideInfo?: {sizeGuide: string; sizePhoto?: string}}).sizeGuideInfo ?? null;
  return (
    <DynamicProductPage
      product={data.product!}
      sizeGuideInfo={sizeGuideInfo}
    />
  );
}

function Breadcrumb() {
  return (
    <nav className="product-breadcrumb" aria-label="Breadcrumb">
      <Link to="/collections/all" className="breadcrumb-link"><span className="breadcrumb-arrow">&lsaquo;</span> <span className="breadcrumb-text">Shop All</span></Link>
    </nav>
  );
}

function SizeGuideInline({url}: {url: string}) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) setSvg(text.replace(/\sfont-size="[^"]*"/g, ''));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);
  if (!svg) return null;
  return <div className="product-size-guide-svg" dangerouslySetInnerHTML={{__html: svg}} />;
}

function ProductNav({handle, catalog}: {handle: string; catalog: CatalogProduct[]}) {
  const [categoryName, setCategoryName] = useState('Shop All');
  const [categoryPath, setCategoryPath] = useState('/collections/all');
  const [nextProductPath, setNextProductPath] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('lastCategoryName') || 'Shop All';
    const path = sessionStorage.getItem('lastCategoryPath') || '/collections/all';
    setCategoryName(name);
    setCategoryPath(path);

    let handles: string[] = [];
    try {
      handles = JSON.parse(sessionStorage.getItem('lastCategoryProducts') || '[]') as string[];
    } catch {}

    // Fall back to full catalog if no category products stored
    if (handles.length === 0 && catalog.length > 0) {
      handles = catalog.map((p) => p.handle);
    }

    if (handles.length > 0) {
      const unique = [...new Set(handles)];
      if (unique.length > 1) {
        const currentIndex = unique.indexOf(handle);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % unique.length : 0;
        setNextProductPath(`/products/${unique[nextIndex]}`);
      } else {
        setNextProductPath('');
      }
    }
  }, [handle, catalog]);

  return (
    <nav className="product-nav">
      <Link to={categoryPath} className="product-nav-btn">
        <span className="nav-arrow">&lsaquo;</span> Back to {categoryName}
      </Link>
      {nextProductPath && (
        <Link to={nextProductPath} className="product-nav-btn">
          Next Product <span className="nav-arrow">&rsaquo;</span>
        </Link>
      )}
    </nav>
  );
}

function DynamicProductPage({product, sizeGuideInfo}: {product: NonNullable<any>; sizeGuideInfo?: {sizeGuide: string; sizePhoto?: string} | null}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  // Catalog from root loader for Shop Others
  const rootData = useRouteLoaderData('root') as {searchCatalog?: CatalogProduct[]} | undefined;
  const catalog = rootData?.searchCatalog ?? [];

  // Recently viewed tracking
  const recentlyViewed = useRecentlyViewed(
    product.handle,
    product.title,
    selectedVariant?.image?.url || '',
    selectedVariant?.price,
  );

  // Shop Others: deterministic pick based on product handle
  const shopOthers = useMemo(() => {
    const others = catalog.filter((p) => p.handle !== product.handle);
    if (others.length === 0) return [];
    // Seed from handle so the selection is stable across re-renders
    let seed = 0;
    for (let i = 0; i < product.handle.length; i++) seed += product.handle.charCodeAt(i);
    const start = seed % others.length;
    const picked: typeof others = [];
    for (let i = 0; i < Math.min(4, others.length); i++) {
      picked.push(others[(start + i) % others.length]);
    }
    return picked;
  }, [catalog, product.handle]);

  const {title, descriptionHtml} = product;
  const {formRef, showSticky, stickyBox} = useStickyAddToCart();
  const isSoldOut = !selectedVariant?.availableForSale;
  const [sizeWarning, setSizeWarning] = useState(false);

  type CarouselImage = {url: string; isModel: boolean; width?: number; height?: number};
  const images: CarouselImage[] = [];
  const altByUrl = new Map<string, string>(
    (product.images?.nodes ?? []).map((img: any) => [img.url, (img.altText ?? '').toLowerCase()]),
  );
  const isModelAlt = (url: string) => (altByUrl.get(url) ?? '').includes('model');
  if (selectedVariant?.image?.url) {
    images.push({
      url: selectedVariant.image.url,
      isModel: isModelAlt(selectedVariant.image.url),
      width: selectedVariant.image.width ?? undefined,
      height: selectedVariant.image.height ?? undefined,
    });
  }
  const selectedColorName = selectedVariant?.selectedOptions?.find(
    (o: any) => o.name.toLowerCase() === 'color',
  )?.value;
  // Exclude every variant-linked image from the extras pool so other colors'
  // flat-lays don't leak into the current color's carousel. Only non-variant
  // media (lookbooks, detail shots) goes through the color-alt filter.
  const variantImageUrls = new Set<string>(
    (product.variants?.nodes ?? [])
      .map((v: any) => v.image?.url)
      .filter((u: string | undefined): u is string => Boolean(u)),
  );
  const extras = (product.images?.nodes ?? []).filter(
    (img: any) => !variantImageUrls.has(img.url),
  );
  // Only strict-filter when there's more than one color to choose between.
  // Single-color products (even ones that technically have a Color option) show all extras.
  const colorValues = product.options?.find(
    (o: any) => o.name.toLowerCase() === 'color',
  )?.optionValues;
  const hasMultipleColors = (colorValues?.length ?? 0) > 1;
  const picked = selectedColorName && hasMultipleColors
    ? extras.filter((img: any) =>
        img.altText?.toLowerCase().includes(selectedColorName.toLowerCase()),
      )
    : extras;
  for (const img of picked) {
    images.push({
      url: img.url,
      isModel: (img.altText ?? '').toLowerCase().includes('model'),
      width: img.width ?? undefined,
      height: img.height ?? undefined,
    });
  }

  // Nhim tees: variant images are the back view (used for swatches + shop-all
  // thumbnails). On the product page itself, show the matching front view first
  // by swapping it ahead of the variant image.
  const FRONT_FIRST_HANDLES = new Set([
    'nhim-short-sleeve-tee',
    'nhim-long-sleeve-tee',
  ]);
  if (
    FRONT_FIRST_HANDLES.has(product.handle) &&
    images.length >= 2 &&
    !images[0].isModel &&
    !images[1].isModel
  ) {
    [images[0], images[1]] = [images[1], images[0]];
  }

  // Separate color and size options for custom rendering
  const colorOption = productOptions.find(
    (o) => o.name.toLowerCase() === 'color',
  );
  const sizeOption = productOptions.find(
    (o) => o.name.toLowerCase() === 'size',
  );
  const otherOptions = productOptions.filter(
    (o) => o.name.toLowerCase() !== 'color' && o.name.toLowerCase() !== 'size',
  );

  // Get selected size name from variant
  const selectedSizeName = selectedVariant?.selectedOptions?.find(
    (o: any) => o.name.toLowerCase() === 'size',
  )?.value;

  return (
    <div className="product-page">
      <Breadcrumb />
      <ProductNav handle={product.handle} catalog={catalog} />

      <div className="product">
        <ImageCarousel
          images={
            images.length > 0
              ? images
              : [{url: '', isModel: false, width: undefined, height: undefined}]
          }
          alt={`${title}${selectedColorName ? ` — ${selectedColorName}` : ''}`}
        />

        <div className="product-main">
          <h1 className="product-title">{title}</h1>
          <div className="product-price-wrap">
            <div className="product-price">
              {isSoldOut ? 'SOLD OUT' : selectedVariant?.price ? (
                <Money data={selectedVariant.price} />
              ) : ''}
            </div>
          </div>

          {/* Color swatches — matching static design */}
          {colorOption && colorOption.optionValues.length > 1 && (
            <div className="product-options">
              <h5>
                Color: <span style={{color: '#000', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0}}>{selectedColorName}</span>
              </h5>
              <div className="product-color-swatches">
                {colorOption.optionValues.map((value) => {
                  const variantImage = value.firstSelectableVariant?.image?.url;
                  return (
                    <button
                      key={value.name}
                      type="button"
                      className={`product-color-swatch${value.selected ? ' selected' : ''}`}
                      aria-label={value.name}
                      title={value.name}
                      disabled={!value.exists}
                      onClick={() => {
                        if (!value.selected) {
                          navigate(`?${value.variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      {variantImage && <img src={shopifyImg(variantImage, {width: 200, format: 'webp'})} alt={value.name} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selector — matching static design */}
          {sizeOption ? (
            <div className="product-options">
              <h5>
                Size{selectedSizeName ? ': ' : ''}
                {selectedSizeName && (
                  <span style={{color: '#000', fontWeight: 500, textTransform: 'none', letterSpacing: 0}}>{selectedSizeName}</span>
                )}
              </h5>
              <div className="product-options-grid">
                {sizeOption.optionValues.map((value) => (
                  <button
                    key={value.name}
                    type="button"
                    className={`product-options-item${value.selected ? ' selected' : ''}${sizeWarning ? ' size-warning' : ''}`}
                    onClick={() => {
                      setSizeWarning(false);
                      if (!value.selected) {
                        navigate(`?${value.variantUriQuery}`, {
                          replace: true,
                          preventScrollReset: true,
                        });
                      }
                    }}
                  >
                    {value.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="product-options">
              <h5>Size: <span style={{color: '#000', fontWeight: 500, textTransform: 'none', letterSpacing: 0}}>One Size</span></h5>
            </div>
          )}

          {/* Other options (if any beyond Color/Size) */}
          {otherOptions.map((option) => {
            if (option.optionValues.length === 1) return null;
            return (
              <div className="product-options" key={option.name}>
                <h5>{option.name}</h5>
                <div className="product-options-grid">
                  {option.optionValues.map((value) => (
                    <button
                      key={value.name}
                      type="button"
                      className={`product-options-item${value.selected ? ' selected' : ''}`}
                      disabled={!value.exists}
                      style={{opacity: value.available ? 1 : 0.3}}
                      onClick={() => {
                        if (!value.selected) {
                          navigate(`?${value.variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      {value.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Description — matching static design */}
          <div className="product-description">
            <p className="product-description-label">Description</p>
            {descriptionHtml ? (
              <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
            ) : (
              <div><p>Description coming soon.</p></div>
            )}
          </div>

          {/* Size guide — matching static design */}
          {sizeGuideInfo?.sizeGuide && (
            <details className="product-size-guide">
              <summary>
                Size Guide
                <svg className="product-size-guide-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 4.5l4 4 4-4" />
                </svg>
              </summary>
              <div className="product-size-guide-content">
                <SizeGuideInline url={sizeGuideInfo.sizeGuide} />
                {sizeGuideInfo.sizePhoto && (
                  <div className="product-size-guide-photo">
                    <img src={sizeGuideInfo.sizePhoto} alt="Measurement Reference" />
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Add to cart — matching static design */}
          <div className="product-form" ref={formRef}>
            <AddToCartButton
              disabled={isSoldOut}
              onClick={() => {
                if (!selectedSizeName && sizeOption) {
                  setSizeWarning(true);
                  setTimeout(() => setSizeWarning(false), 1500);
                  return;
                }
                preloadCartThumbnail(selectedVariant?.image?.url);
                open('cart');
              }}
              lines={
                selectedVariant
                  ? [{merchandiseId: selectedVariant.id, quantity: 1, selectedVariant}]
                  : []
              }
            >
              {isSoldOut ? 'Sold Out' : sizeWarning ? 'Select a Size' : 'Add to Cart'}
            </AddToCartButton>
          </div>
        </div>
      </div>

      {/* Sticky add to cart — matching static design */}
      {showSticky && (
        <div
          className="sticky-add-to-cart"
          style={
            stickyBox
              ? {left: `${stickyBox.left}px`, width: `${stickyBox.width}px`, right: 'auto'}
              : undefined
          }
        >
          <AddToCartButton
            disabled={isSoldOut}
            onClick={() => {
              if (isSoldOut) return;
              if (!selectedSizeName && sizeOption) {
                setSizeWarning(true);
                setTimeout(() => setSizeWarning(false), 1500);
                return;
              }
              preloadCartThumbnail(selectedVariant?.image?.url);
              open('cart');
            }}
            lines={
              selectedVariant
                ? [{merchandiseId: selectedVariant.id, quantity: 1, selectedVariant}]
                : []
            }
          >
            {isSoldOut ? 'Sold Out' : sizeWarning ? 'Select a Size' : 'Add to Cart'}
          </AddToCartButton>
        </div>
      )}

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

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="product-related-section">
          <h2 className="product-related-heading">Recently Viewed</h2>
          <div className="product-related-grid">
            {recentlyViewed.map((item) => (
              <Link key={item.handle} className="product-item" prefetch="intent" to={`/products/${item.handle}`} data-handle={item.handle}>
                <div className="product-item-img">
                  {item.image && <img src={shopifyImg(item.image, {width: 800, format: 'webp'})} alt={item.title} loading="lazy" />}
                </div>
                <h4>{item.title}</h4>
                {item.price && (
                  <small>
                    <Money data={item.price as any} />
                  </small>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Shop Others */}
      {shopOthers.length > 0 && (
        <div className="product-related-section">
          <h2 className="product-related-heading">Shop Others</h2>
          <div className="product-related-grid">
            {shopOthers.map((item) => (
              <Link key={item.handle} className="product-item" prefetch="intent" to={`/products/${item.handle}`} data-handle={item.handle}>
                <div className="product-item-img">
                  {item.image && <img src={shopifyImg(item.image, {width: 800, format: 'webp'})} alt={item.title} loading="lazy" />}
                </div>
                <h4>{item.title}</h4>
                {item.price && (
                  <small>
                    <Money data={item.price as any} />
                  </small>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function ImageZoomOverlay({src, alt, width, height, onClose}: {src: string; alt: string; width?: number; height?: number; onClose: () => void}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const lowImgRef = useRef<HTMLImageElement>(null);
  const [highReady, setHighReady] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const img = lowImgRef.current;
    if (!overlay || !img) return;
    const scrollTop = (img.offsetHeight - overlay.clientHeight) / 2;
    if (scrollTop > 0) overlay.scrollTop = scrollTop;
  }, []);

  return (
    <div className="zoom-overlay" onClick={onClose} ref={overlayRef}>
      <button className="zoom-close" onClick={onClose} aria-label="Close zoom">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 4l12 12M16 4L4 16" />
        </svg>
      </button>
      {/*
        Two stacked images. The low layer reuses the carousel's exact srcset/sizes
        so the browser pulls it from the in-memory cache → paints in the first
        frame. The high layer (2000w, no srcset) matches the preload kicked off
        in the carousel, then fades in when ready.
      */}
      <div className="zoom-image-stack" onClick={(e) => e.stopPropagation()}>
        <img
          ref={lowImgRef}
          src={shopifyImg(src, {width: 1200})}
          srcSet={shopifySrcSet(src, CAROUSEL_WIDTHS)}
          sizes={CAROUSEL_SIZES}
          alt=""
          aria-hidden="true"
          width={width}
          height={height}
          className="zoom-image zoom-image-low"
          decoding="async"
        />
        <img
          src={shopifyImg(src, {width: 2000})}
          alt={alt}
          width={width}
          height={height}
          className={`zoom-image zoom-image-high${highReady ? ' loaded' : ''}`}
          fetchPriority="high"
          decoding="async"
          onLoad={() => setHighReady(true)}
        />
      </div>
    </div>
  );
}

function ImageCarousel({
  images,
  alt,
}: {
  images: {url: string; isModel: boolean; width?: number; height?: number}[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [images[0]?.url]);

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  // Warm the neighbors so arrow/swipe feels instant.
  useEffect(() => {
    if (images.length <= 1) return;
    const prevUrl = images[(index - 1 + images.length) % images.length]?.url;
    const nextUrl = images[(index + 1) % images.length]?.url;
    preloadImage(prevUrl, 1200);
    preloadImage(nextUrl, 1200);
  }, [index, images]);

  // Warm the zoom-resolution variant so clicking the image feels instant.
  useEffect(() => {
    preloadImage(images[index]?.url, 2000);
  }, [index, images]);

  // Track Y too so we can ignore swipes that are mostly vertical (= page
  // scroll). Combined with `touch-action: pan-y` on .carousel-main, this stops
  // accidental image changes while scrolling the product page.
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (startX === null || startY === null) return;
    const dx = startX - e.changedTouches[0].clientX;
    const dy = startY - e.changedTouches[0].clientY;
    // Only count as swipe if it's clearly horizontal AND past the threshold.
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      dx > 0 ? next() : prev();
    }
  }

  function handleTouchCancel() {
    touchStartX.current = null;
    touchStartY.current = null;
  }

  const current = images[index];
  return (
    <div className="product-image-carousel">
      <div
        className="carousel-main"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className={`product-image product-image-zoomable${current?.isModel ? ' product-image-model' : ''}`} onClick={() => setZoomed(true)}>
          <img
            src={shopifyImg(current?.url, {width: 1200})}
            srcSet={shopifySrcSet(current?.url, CAROUSEL_WIDTHS)}
            sizes={CAROUSEL_SIZES}
            alt={alt}
            key={current?.url}
            width={current?.width}
            height={current?.height}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            decoding="async"
          />
        </div>
        {images.length > 1 && (
          <>
            <button className="carousel-arrow carousel-arrow-left" onClick={prev} aria-label="Previous image">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l-6 6 6 6" />
              </svg>
            </button>
            <button className="carousel-arrow carousel-arrow-right" onClick={next} aria-label="Next image">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4l6 6-6 6" />
              </svg>
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="carousel-dots">
          {images.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot${i === index ? ' active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
      {zoomed && (
        <ImageZoomOverlay
          src={current?.url ?? ''}
          alt={alt}
          width={current?.width}
          height={current?.height}
          onClose={() => setZoomed(false)}
        />
      )}
    </div>
  );
}

function useStickyAddToCart() {
  const formRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [stickyBox, setStickyBox] = useState<{left: number; width: number} | null>(null);

  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const btn = (el.querySelector('button') as HTMLElement) ?? el;

    function update() {
      const rect = btn.getBoundingClientRect();
      // Only show sticky when the real button is below the viewport. If the
      // user has scrolled past it (rect.bottom < 0), keep sticky hidden so
      // related-product sections aren't covered.
      setShowSticky(rect.top > window.innerHeight);
      setStickyBox({left: rect.left, width: rect.width});
    }

    update();

    // IntersectionObserver fires on any visibility change — including layout
    // shifts from expanding <details> (description, size guide), which don't
    // emit scroll/resize events.
    const obs = new IntersectionObserver(() => update(), {threshold: [0, 1]});
    obs.observe(btn);
    window.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update, {passive: true});
    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return {formRef, showSticky, stickyBox};
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
    images(first: 20) {
      nodes {
        url
        altText
        width
        height
      }
    }
    variants(first: 20) {
      nodes {
        image {
          url
        }
      }
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

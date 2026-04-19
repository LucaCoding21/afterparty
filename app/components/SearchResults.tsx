import {Link} from 'react-router';
import {Money, Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams, type RegularSearchReturn} from '~/lib/search';
import {flattenToColorVariants} from '~/lib/collections';
import {shopifyImg} from '~/lib/images';

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>Articles</h2>
      <div>
        {articles?.nodes?.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item" key={article.id}>
              <Link prefetch="intent" to={articleUrl}>
                {article.title}
              </Link>
            </div>
          );
        })}
      </div>
      <br />
    </div>
  );
}

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>Pages</h2>
      <div>
        {pages?.nodes?.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item" key={page.id}>
              <Link prefetch="intent" to={pageUrl}>
                {page.title}
              </Link>
            </div>
          );
        })}
      </div>
      <br />
    </div>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <Pagination connection={products}>
      {({nodes, isLoading, NextLink, PreviousLink}) => {
        const items = flattenToColorVariants(nodes);
        return (
          <div>
            <div className="search-results-grid">
              {items.map((item) => {
                const baseUrl = urlWithTrackingParams({
                  baseUrl: `/products/${item.handle}`,
                  trackingParams: item.trackingParameters,
                  term,
                });
                const optionParams = new URLSearchParams();
                if (item.selectedOptions?.length) {
                  for (const opt of item.selectedOptions) optionParams.set(opt.name, opt.value);
                } else if (item.colorName) {
                  optionParams.set('Color', item.colorName);
                }
                const optionQs = optionParams.toString();
                const productUrl = optionQs ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${optionQs}` : baseUrl;
                return (
                  <Link key={item.id} prefetch="intent" to={productUrl} className="product-item" data-handle={item.handle}>
                    <div className="product-item-img">
                      {item.image && <img src={shopifyImg(item.image, {width: 800, format: 'webp'})} alt={item.title} loading="lazy" />}
                    </div>
                    <h4>{item.title}</h4>
                    <small>
                      {!item.availableForSale ? 'SOLD OUT' : item.price ? <Money data={item.price} /> : ''}
                    </small>
                  </Link>
                );
              })}
            </div>
            <div className="search-pagination">
              <PreviousLink className="search-pagination-btn">
                {isLoading ? 'Loading...' : 'Load previous'}
              </PreviousLink>
              <NextLink className="search-pagination-btn">
                {isLoading ? 'Loading...' : 'Load more'}
              </NextLink>
            </div>
          </div>
        );
      }}
    </Pagination>
  );
}

function SearchResultsEmpty() {
  return null;
}

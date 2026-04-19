import {createHydrogenContext, type I18nBase} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';

/**
 * Detect visitor's country from request headers.
 * - Oxygen hosting provides `Oxygen-Buyer-Country` from IP geolocation.
 * - Falls back to VN (Vietnam) as the primary market.
 * - Vietnamese visitors get VND prices, everyone else gets their local currency.
 */
function getLocaleFromRequest(request: Request): I18nBase {
  const buyerCountry = (request.headers.get('Oxygen-Buyer-Country') ?? '').toUpperCase();
  if (buyerCountry === 'VN') {
    return {language: 'VI', country: 'VN'};
  }
  return {language: 'EN', country: 'US'};
}

// Define the additional context object
const additionalContext = {
  // Additional context for custom properties, CMS clients, 3P SDKs, etc.
  // These will be available as both context.propertyName and context.get(propertyContext)
  // Example of complex objects that could be added:
  // cms: await createCMSClient(env),
  // reviews: await createReviewsClient(env),
} as const;

// Automatically augment HydrogenAdditionalContext with the additional context type
type AdditionalContextType = typeof additionalContext;

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType {}
}

/**
 * Creates Hydrogen context for React Router 7.9.x
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 * */
export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: getLocaleFromRequest(request),
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
    },
    additionalContext,
  );

  return hydrogenContext;
}

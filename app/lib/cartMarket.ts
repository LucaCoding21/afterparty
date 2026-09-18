import type {CartReturn, HydrogenCart, I18nBase} from '@shopify/hydrogen';
import {syncKeycapGift} from '~/lib/keycapGift';

type CartContext = {
  cart: HydrogenCart;
  storefront: {i18n: I18nBase};
};

/**
 * The root loader and the /cart loader both call `getCartForMarket` in the
 * same request. Share one promise per request so the gift sync cannot run
 * twice in parallel and add the keycap twice.
 */
const inflight = new WeakMap<HydrogenCart, Promise<CartReturn | null>>();

/**
 * Load the cart, make sure it is priced in the visitor's market, and keep the
 * free keycap gift line in step with what the cart has earned.
 *
 * A cart is priced in the currency of the country it was created in and does
 * not follow the request's `@inContext` country afterwards. That leaves two
 * cases where the cart currency drifts from the prices shown on product pages:
 * carts created before the KR/JP/AU markets existed (all stamped US/USD), and
 * visitors whose detected country changes. Re-stamping the buyer country
 * re-prices the cart, which also keeps the free-shipping note in CartMain
 * (keyed by cart currency) in the right currency.
 */
export function getCartForMarket(context: CartContext) {
  let pending = inflight.get(context.cart);
  if (!pending) {
    pending = loadCart(context);
    inflight.set(context.cart, pending);
  }
  return pending;
}

async function loadCart({
  cart,
  storefront,
}: CartContext): Promise<CartReturn | null> {
  let current = await cart.get();
  if (!current) return current;

  const country = storefront.i18n.country;
  if (current.buyerIdentity?.countryCode !== country) {
    try {
      const result = await cart.updateBuyerIdentity({countryCode: country});
      if (result.userErrors?.length) {
        console.error('cart buyer country update failed', result.userErrors);
      } else {
        // Mutations return the full cart fragment (see CART_MUTATE_FRAGMENT).
        current = result.cart?.lines
          ? result.cart
          : ((await cart.get()) ?? current);
      }
    } catch (error) {
      console.error(error);
    }
  }

  try {
    return await syncKeycapGift(cart, current);
  } catch (error) {
    console.error(error);
    return current;
  }
}

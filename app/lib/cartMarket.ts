import type {CartReturn, HydrogenCart, I18nBase} from '@shopify/hydrogen';

type CartContext = {
  cart: HydrogenCart;
  storefront: {i18n: I18nBase};
};

/**
 * Load the cart and make sure it is priced in the visitor's market.
 *
 * A cart is priced in the currency of the country it was created in and does
 * not follow the request's `@inContext` country afterwards. That leaves two
 * cases where the cart currency drifts from the prices shown on product pages:
 * carts created before the KR/JP/AU markets existed (all stamped US/USD), and
 * visitors whose detected country changes. Re-stamping the buyer country
 * re-prices the cart, which also keeps the free-shipping note in CartMain
 * (keyed by cart currency) in the right currency.
 */
export async function getCartForMarket({
  cart,
  storefront,
}: CartContext): Promise<CartReturn | null> {
  const current = await cart.get();
  const country = storefront.i18n.country;
  if (!current || current.buyerIdentity?.countryCode === country) {
    return current;
  }
  try {
    const result = await cart.updateBuyerIdentity({countryCode: country});
    if (result.userErrors?.length) {
      console.error('cart buyer country update failed', result.userErrors);
      return current;
    }
    // Mutations return Hydrogen's minimal cart fragment (no cost, no lines),
    // so re-read the cart with the full query fragment.
    return (await cart.get()) ?? current;
  } catch (error) {
    console.error(error);
    return current;
  }
}

import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {type OptimisticCart} from '@shopify/hydrogen';
import {Price} from '~/components/Price';
import {optimisticCartSubtotal} from '~/lib/optimisticCart';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  // While an action is pending the server subtotal lags; see optimisticCart.ts.
  const displaySubtotal = optimisticCartSubtotal(cart);

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <div className="cart-subtotal">
        <span>Subtotal</span>
        <span>
          {displaySubtotal ? <Price data={displaySubtotal} /> : '—'}
        </span>
      </div>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <a href={checkoutUrl} target="_self" className="cart-checkout-btn">
      Checkout
    </a>
  );
}

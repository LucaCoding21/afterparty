import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {Money, type OptimisticCart} from '@shopify/hydrogen';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  // Hydrogen's useOptimisticCart doesn't recompute cost.subtotalAmount, so
  // while an add/update is in flight the server total lags. Sum the per-line
  // totals (which Hydrogen fills for optimistic lines) to show instant totals.
  const displaySubtotal = optimisticSubtotal(cart);

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <div className="cart-subtotal">
        <span>Subtotal</span>
        <span>
          {displaySubtotal ? <Money data={displaySubtotal} /> : '—'}
        </span>
      </div>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function optimisticSubtotal(
  cart: OptimisticCart<CartApiQueryFragment | null>,
) {
  const lines = cart?.lines?.nodes ?? [];
  const hasOptimistic = lines.some((line: any) => line.isOptimistic);
  if (!hasOptimistic) return cart?.cost?.subtotalAmount ?? null;

  let total = 0;
  let currencyCode = cart?.cost?.subtotalAmount?.currencyCode;
  for (const line of lines) {
    const amt = Number((line as any)?.cost?.totalAmount?.amount ?? 0);
    if (Number.isFinite(amt)) total += amt;
    currencyCode =
      currencyCode ?? (line as any)?.cost?.totalAmount?.currencyCode;
  }
  if (!currencyCode) return cart?.cost?.subtotalAmount ?? null;
  return {amount: total.toFixed(2), currencyCode};
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <a href={checkoutUrl} target="_self" className="cart-checkout-btn">
      Checkout
    </a>
  );
}

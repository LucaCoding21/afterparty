import {useOptimisticCart, type OptimisticCartLine} from '@shopify/hydrogen';
import {Link, useNavigate, useRouteLoaderData} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {RootLoader} from '~/root';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {formatMoney} from '~/lib/money';
import {
  KEYCAP_GIFT_THRESHOLD_VND,
  keycapGiftEarned,
  keycapQualifyingAmount,
  isKeycapLine,
  withOptimisticKeycapGift,
  type KeycapCartLike,
} from '~/lib/keycapGift';
import {
  optimisticCartSubtotal,
  withOptimisticLineCosts,
} from '~/lib/optimisticCart';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

/**
 * Free-shipping thresholds per market, keyed by the cart's currency. Shopify
 * Markets price each cart in exactly one of these currencies (see
 * `getLocaleFromRequest` in app/lib/context.ts), so the currency tells us
 * which market's rule applies. The thresholds mirror the conditional
 * "Free shipping" rates in Shopify admin (Settings > Shipping, one per zone);
 * change both together.
 */
type FreeShippingRule = {
  threshold: number;
  /** Trailing scope note, e.g. " (Korea only)". Empty for the worldwide USD market. */
  scope: string;
  format: (amount: number) => string;
};

function formatWithSymbol(currency: string) {
  return (amount: number) =>
    formatMoney(
      {amount: String(amount), currencyCode: currency},
      {withoutTrailingZeros: true, alwaysShowCode: true},
    );
}

const FREE_SHIPPING_RULES: Record<string, FreeShippingRule> = {
  VND: {
    threshold: 1_000_000,
    scope: ' (Vietnam only)',
    format: (amount) => `${new Intl.NumberFormat('vi-VN').format(amount)} VND`,
  },
  USD: {threshold: 200, scope: '', format: formatWithSymbol('USD')},
  KRW: {
    threshold: 150_000,
    scope: ' (Korea only)',
    format: formatWithSymbol('KRW'),
  },
  JPY: {
    threshold: 15_000,
    scope: ' (Japan only)',
    format: formatWithSymbol('JPY'),
  },
  AUD: {
    threshold: 200,
    scope: ' (Australia only)',
    format: formatWithSymbol('AUD'),
  },
};

/** Currency a visitor's cart will be created in, for when there is no cart yet. */
const MARKET_CURRENCY: Record<string, string> = {
  VN: 'VND',
  KR: 'KRW',
  JP: 'JPY',
  AU: 'AUD',
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};
/** Returns a map of all line items and their children. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const children = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(children)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}
/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const rootData = useRouteLoaderData<RootLoader>('root');
  // Hydrogen leaves line and cart totals stale while an action is pending,
  // so fix the line totals first, then add or drop the free keycap line
  // optimistically too, so it shows up in the same paint as the item that
  // earned it.
  const cart = withOptimisticKeycapGift(
    withOptimisticLineCosts(useOptimisticCart(originalCart), originalCart),
    rootData?.keycapVariant,
  );

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);
  // An empty cart has no cost yet, so fall back to the visitor's market.
  const subtotal = optimisticCartSubtotal(cart);
  const currency =
    subtotal?.currencyCode ??
    MARKET_CURRENCY[rootData?.consent?.country ?? ''] ??
    'USD';
  const freeShippingRule = FREE_SHIPPING_RULES[currency];

  return (
    <div className={className}>
      <CartEmpty hidden={linesCount} layout={layout} />
      <div className="cart-details">
        <p id="cart-lines" className="sr-only">
          Line items
        </p>
        <div>
          <ul aria-labelledby="cart-lines">
            {sortKeycapLast(cart?.lines?.nodes ?? []).map((line) => {
              // we do not render non-parent lines at the root of the cart
              if (
                'parentRelationship' in line &&
                line.parentRelationship?.parent
              ) {
                return null;
              }
              return (
                <CartLineItem
                  key={line.id}
                  line={line}
                  layout={layout}
                  childrenMap={childrenMap}
                />
              );
            })}
          </ul>
          {cartHasItems && (
            <p className="cart-taxes-note">
              Taxes and shipping calculated at checkout
            </p>
          )}
          {freeShippingRule && (
            <FreeShippingNote rule={freeShippingRule} subtotal={subtotal} />
          )}
          <FreeKeycapNote cart={cart} currency={currency} />
        </div>
      </div>
      {cartHasItems && <CartSummary cart={cart} layout={layout} />}
    </div>
  );
}

function FreeShippingNote({
  rule,
  subtotal,
}: {
  rule: FreeShippingRule;
  subtotal?: {amount?: string; currencyCode?: string};
}) {
  // An empty cart has no subtotal, so default the amount to 0 to still show
  // the full "away from free shipping" line.
  const remaining = rule.threshold - Number(subtotal?.amount ?? 0);
  return (
    <p className="cart-shipping-note">
      {remaining > 0
        ? `${rule.format(remaining)} away from free shipping${rule.scope}`
        : `You’re eligible for free shipping${rule.scope}`}
    </p>
  );
}

/** The keycap always sits under the real items, whichever order it was added in. */
function sortKeycapLast<T extends Parameters<typeof isKeycapLine>[0]>(
  lines: T[],
) {
  return [...lines].sort(
    (a, b) => Number(isKeycapLine(a)) - Number(isKeycapLine(b)),
  );
}

/**
 * Free Nhím Keycap Clicker gift note, directly under the free-shipping line.
 * Vietnam (VND carts) earns it at a threshold; every other market gets it on
 * any order. The keycap itself is added and priced to zero by
 * `syncKeycapGift` in app/lib/keycapGift.ts plus the Shopify discounts; this
 * is only copy, and it measures the cart the same way Shopify does (without
 * the keycap).
 */
function FreeKeycapNote({
  cart,
  currency,
}: {
  cart: KeycapCartLike | null | undefined;
  currency: string;
}) {
  // An empty cart has no lines yet; like the shipping note, still show the
  // full "away from" line in Vietnam.
  const earned = cart ? keycapGiftEarned(cart) : false;
  if (currency === 'VND' && !earned) {
    const remaining =
      KEYCAP_GIFT_THRESHOLD_VND - (cart ? keycapQualifyingAmount(cart) : 0);
    return (
      <p className="cart-shipping-note cart-gift-note">
        {`${FREE_SHIPPING_RULES.VND.format(remaining)} away from free Nhím Keycap Clicker`}
      </p>
    );
  }
  if (!earned) return null;
  return (
    <p className="cart-shipping-note cart-gift-note">
      Free Nhím Keycap Clicker added to your order
    </p>
  );
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();
  const navigate = useNavigate();
  if (hidden) return null;
  return (
    <div className="cart-empty">
      <p className="cart-empty-msg">Your cart is empty.</p>
      <button
        onClick={() => {
          close();
          const lastCategory =
            typeof sessionStorage !== 'undefined'
              ? sessionStorage.getItem('lastCategoryPath')
              : null;
          navigate(lastCategory || '/collections/all');
        }}
        className="cart-empty-link"
      >
        Continue Shopping
      </button>
    </div>
  );
}

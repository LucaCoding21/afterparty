/**
 * Corrections to Hydrogen's optimistic cart.
 *
 * `useOptimisticCart` applies pending cart actions to the last server cart
 * so the drawer reacts on the same paint as the tap. It gets `quantity` and
 * `totalQuantity` right but never touches money: a quantity update, or a
 * repeat add of a variant already in the cart, keeps the line's server
 * `cost.totalAmount`, a brand-new line has no `cost` at all, and
 * `cost.subtotalAmount` stays whatever the server last said. Anything that
 * shows or compares an amount then lags until the response lands.
 */
// Structural types loose enough for the generated cart fragment, Hydrogen's
// optimistic cart and the pending lines it fabricates.
type Money = {amount?: string | null; currencyCode?: string | null};

type LineLike = {
  id: string;
  quantity?: number;
  cost?: {
    totalAmount?: Money | null;
    amountPerQuantity?: Money | null;
  } | null;
  merchandise?: {price?: Money | null} | null;
};

export type OptimisticCartLike = {
  isOptimistic?: boolean;
  lines?: {nodes: LineLike[]} | null;
  cost?: {subtotalAmount?: Money | null} | null;
};

/**
 * Give every line whose quantity differs from the server cart a
 * `cost.totalAmount` of unit price x quantity. Lines the pending action did
 * not touch keep their exact server total, discounts included. No-op unless
 * the cart is optimistic.
 */
export function withOptimisticLineCosts<
  T extends OptimisticCartLike | null | undefined,
>(cart: T, original: OptimisticCartLike | null | undefined): T {
  if (!cart?.isOptimistic || !cart.lines) return cart;
  const serverQuantity = new Map(
    (original?.lines?.nodes ?? []).map((line) => [line.id, line.quantity ?? 1]),
  );
  let changed = false;
  const nodes = cart.lines.nodes.map((line) => {
    const quantity = line.quantity ?? 1;
    if (serverQuantity.get(line.id) === quantity) return line;
    const unit = line.cost?.amountPerQuantity ?? line.merchandise?.price;
    if (unit?.amount == null) return line;
    changed = true;
    return {
      ...line,
      cost: {
        ...line.cost,
        amountPerQuantity: unit,
        totalAmount: {
          amount: (Number(unit.amount) * quantity).toFixed(2),
          currencyCode: unit.currencyCode,
        },
      },
    };
  });
  return changed ? ({...cart, lines: {...cart.lines, nodes}} as T) : cart;
}

/**
 * The cart subtotal to display: the server value for a settled cart, the
 * sum of the (corrected) line totals while an action is pending.
 */
export function optimisticCartSubtotal<
  T extends OptimisticCartLike | null | undefined,
>(cart: T): NonNullable<NonNullable<T>['cost']>['subtotalAmount'] | undefined {
  const server = cart?.cost?.subtotalAmount;
  if (!cart?.isOptimistic) return server;
  let total = 0;
  let currencyCode = server?.currencyCode;
  for (const line of cart.lines?.nodes ?? []) {
    const money = line.cost?.totalAmount;
    if (money?.amount == null) continue;
    total += Number(money.amount);
    currencyCode ??= money.currencyCode;
  }
  if (!currencyCode) return server;
  return {amount: total.toFixed(2), currencyCode} as NonNullable<
    NonNullable<T>['cost']
  >['subtotalAmount'];
}

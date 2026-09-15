/**
 * Price formatting for the storefront.
 *
 * Every visitor is priced in exactly one currency by Shopify Markets (see
 * `getLocaleFromRequest` in app/lib/context.ts) and there is no currency
 * switcher. Prices use the narrow symbol with a US locale, matching what
 * Hydrogen's `<Money />` rendered before this helper existed.
 *
 * Dollar currencies are the ambiguous ones: an Australian seeing "$20.00"
 * assumes USD. So for the currencies listed in CURRENCIES_WITH_CODE the ISO
 * code is appended, e.g. "$20.00 AUD". Add "CAD" here when the Canada market
 * launches. Everything else stays bare ("$20.00", "₩150,000").
 */
const CURRENCIES_WITH_CODE = new Set(['AUD']);

/** Loose on purpose: optimistic cart lines can carry partial money objects. */
export type MoneyLike = {amount?: string | null; currencyCode?: string | null};

export function formatMoney(
  money: MoneyLike,
  {
    withoutTrailingZeros = false,
    alwaysShowCode = false,
  }: {withoutTrailingZeros?: boolean; alwaysShowCode?: boolean} = {},
): string {
  if (!money.amount || !money.currencyCode) return '';
  const amount = Number.parseFloat(money.amount);
  const code = money.currencyCode.toUpperCase();
  const digits = withoutTrailingZeros && Number.isInteger(amount) ? 0 : undefined;
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      ...(digits === undefined
        ? {}
        : {minimumFractionDigits: digits, maximumFractionDigits: digits}),
    }).format(amount);
  } catch {
    formatted = amount.toFixed(2);
  }
  return alwaysShowCode || CURRENCIES_WITH_CODE.has(code)
    ? `${formatted} ${code}`
    : formatted;
}

import type {ElementType, ComponentPropsWithoutRef} from 'react';
import {formatMoney, type MoneyLike} from '~/lib/money';

type PriceProps<T extends ElementType> = {
  data: MoneyLike;
  /** Element to render. Defaults to `div`, matching Hydrogen's `<Money />`. */
  as?: T;
  withoutTrailingZeros?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'data'>;

/**
 * Drop-in replacement for Hydrogen's `<Money />` that appends the ISO code
 * for AUD only ("$20.00 AUD"). See app/lib/money.ts for why.
 */
export function Price<T extends ElementType = 'div'>({
  data,
  as,
  withoutTrailingZeros,
  ...rest
}: PriceProps<T>) {
  const Wrapper = (as ?? 'div') as ElementType;
  return <Wrapper {...rest}>{formatMoney(data, {withoutTrailingZeros})}</Wrapper>;
}

import {DeliveryDiscountSelectionStrategy, DiscountClass} from '../generated/api';
import {promoActive, qualifyingAmount, readConfig} from './config';

/**
 * Black Friday free shipping.
 *
 * Needs the shipping class on the discount and a `promo` config (see
 * ./config.js), and acts only during the sale or for a preview cart. It
 * makes every delivery option free once the cart, without keycaps, reaches
 * the threshold for its currency. Thresholds are in the cart's own
 * currency, so they are exact per market (a native discount minimum would
 * be converted from the shop's USD).
 */

/**
 * @typedef {import("../generated/api").DeliveryInput} DeliveryInput
 * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
 */

/**
 * @param {DeliveryInput} input
 * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
 */
export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  if (!input.discount.discountClasses.includes(DiscountClass.Shipping)) {
    return {operations: []};
  }

  const config = readConfig(input);
  if (!config.promo || !promoActive(input, config.promo)) {
    return {operations: []};
  }

  const currency = input.cart.cost.subtotalAmount.currencyCode;
  const minimum = config.promo.freeShippingMinimumByCurrency[currency];
  if (minimum == null) return {operations: []};
  if (qualifyingAmount(input.cart.lines, config) < minimum) {
    return {operations: []};
  }

  const groups = input.cart.deliveryGroups;
  if (!groups.length) return {operations: []};

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
          candidates: [
            {
              message: 'Free shipping',
              targets: groups.map((group) => ({
                deliveryGroup: {id: group.id},
              })),
              value: {percentage: {value: 100}},
            },
          ],
        },
      },
    ],
  };
}

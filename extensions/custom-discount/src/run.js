// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";
import { validateDiscounts } from "../helpers/validations";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult 
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  /**
   * @type {{
  *   quantity: number,
  *   percentage: number,
  *   collectionsToApply: any,
  *   collectionsToIgnore: any
  * }}
  */
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  if (!configuration.percentage) {
    return EMPTY_DISCOUNT;
  } 

  const targets = validateDiscounts(input.cart.lines, configuration);

  if (!targets.length) {
    return EMPTY_DISCOUNT;
  }

  return {
    discounts: [
      {
        targets,
        value: {
          percentage: {
            value: configuration.percentage.toString()
          }
        }
      }
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First
  };
}; 
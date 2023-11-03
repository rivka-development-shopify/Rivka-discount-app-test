// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Target} Target
 * @typedef {import("../generated/api").ProductVariant} ProductVariant
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
  *   quantity: number
  *   percentage: number
  *   sku: string
  * }}
  */
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  if (!configuration.sku || !configuration.percentage) {
    return EMPTY_DISCOUNT;
  }
  
  const targets = input.cart.lines
    .filter(line => {
      const variant = /** @type {ProductVariant} */ (line.merchandise);
      const search = variant.product.inCollections;
      const found = search.filter(item => item.isMember);
      found?.forEach(item => console.log("founded: ", item.isMember, item.collectionId));
      
      return variant.product.inCollections.filter(item => item.collectionId == "293047468184") && line.merchandise.__typename == "ProductVariant"
      /* if (!variant.product.inAnyCollection) {
        return console.log('Some product(s) in your cart are not elegible for this discount')
      } else {
        return variant.metafield?.value == "true" && line.merchandise.__typename == "ProductVariant"      
      } */
    })
    .map(line => {
      const variant = /** @type {ProductVariant} */ (line.merchandise);
      return /** @type {Target} */ ({
        productVariant: {
          id: variant.id
        }
      });
    });

  if (!targets.length) {
    console.error("No cart lines qualify for volume discount.");
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
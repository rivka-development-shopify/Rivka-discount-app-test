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
  *   collectionsToApplyIds: string[],
  *   collectionsToIgnoreIds: string[]
  * }}
  */
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  if (!configuration.percentage) {
    return EMPTY_DISCOUNT;
  }

  const { collectionsToApplyIds, collectionsToIgnoreIds } = configuration;

  const validateDiscount = (lines) => {
    return lines.filter(line => {
      const variant = /** @type {ProductVariant} */ (line.merchandise);
      if(collectionsToApplyIds.length >= 1 && collectionsToIgnoreIds.length >= 1) {
        if(variant.metafield?.value === 'false') {
          return variant.product.inCollections.map(({ collectionId, isMember }) => {
              if (isMember) {
                  return collectionsToApplyIds.indexOf(collectionId) > -1
              }
              return collectionsToIgnoreIds.indexOf(collectionId) > -1
          }).every((value) => value === true)
        }
      }
      if(collectionsToApplyIds.length == 0 && collectionsToIgnoreIds.length >= 1) {
        if(variant.metafield?.value === 'false') {
          return variant.product.inCollections.map(({ collectionId, isMember }) => {
              if (!isMember) {
                  return collectionsToIgnoreIds.indexOf(collectionId) > -1
              }
          }).every((value) => value === true)
        }
        if(variant.metafield?.value === 'true') {
          return variant.product.inCollections.map(({ collectionId, isMember }) => {
              if (!isMember) {
                  return collectionsToIgnoreIds.indexOf(collectionId) > -1
              }
          }).every((value) => value === true)
        }
      }
      if(collectionsToApplyIds.length >= 1 && collectionsToIgnoreIds.length == 0) {
        return variant.product.inCollections.map(({ collectionId, isMember }) => {
            if (isMember) {
                return collectionsToApplyIds.indexOf(collectionId) > -1
            }
        }).every((value) => value === true)
      }
    })
    .map(line => {
      const variant = /** @type {ProductVariant} */ (line.merchandise);
      return /** @type {Target} */ ({
        productVariant: {
          id: variant.id
        }
      });
    });
  }

  const targets = validateDiscount(input.cart.lines);

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

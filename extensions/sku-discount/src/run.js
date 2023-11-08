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
  *   belongsToCollectionIds: string[],
  *   notBelongsToCollectionIds: string[]
  * }}
  */
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  if (!configuration.percentage) {
    return EMPTY_DISCOUNT;
  }

  const { belongsToCollectionIds, notBelongsToCollectionIds } = configuration;
  
  const targets = input.cart.lines
    .filter(line => {
      const variant = /** @type {ProductVariant} */ (line.merchandise);
      if(belongsToCollectionIds.length >= 1 && notBelongsToCollectionIds.length >= 1) {        
        if(variant.metafield?.value === 'false') {        
          return variant.product.inCollections.map(({ collectionId, isMember }) => {
              if (isMember) {
                  return belongsToCollectionIds.indexOf(collectionId) > -1
              }
              return notBelongsToCollectionIds.indexOf(collectionId) > -1
          }).every((value) => value === true)
        }
      }
      if(belongsToCollectionIds.length == 0 && notBelongsToCollectionIds.length >= 1) {        
        if(variant.metafield?.value === 'false') {        
          return variant.product.inCollections.map(({ collectionId, isMember }) => {
              if (!isMember) {                  
                  return notBelongsToCollectionIds.indexOf(collectionId) > -1
              }
          }).every((value) => value === true)
        }
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

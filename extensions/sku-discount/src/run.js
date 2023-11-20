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
  *   collectionsToIgnoreIds: string[],
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

  const { collectionsToApplyIds, collectionsToIgnoreIds } = configuration;
  
  const validateDiscount = (lines, { collectionsToApply, collectionsToIgnore }) => {
    collectionsToApply.forEach(collection => console.log('Apply', collection.id))
    collectionsToIgnore.forEach(collection => console.log('Ignore', collection.id))
    const result = lines.filter((line) => {
      const variant = /** @type {ProductVariant} */ (line.merchandise);
      /* Logic to validate SALE25 like Code */
      if(collectionsToApplyIds.length > 0 && collectionsToIgnoreIds.length == 0) {
        return variant.product.inCollections.map(({ collectionId, isMember }) => {
          const matchCollectionFullObject = collectionsToApply.find(collection => collection.id === collectionId);                   
          if (isMember) {            
            if("checkedState" in matchCollectionFullObject === false || (matchCollectionFullObject.checkedState === true && matchCollectionFullObject.radioState === true && variant.metafield?.value === "true")) {
              return collectionsToApplyIds.indexOf(collectionId) > -1
            }
          }            
        }).some((value) => value === true)
      }
      /* Logic to validate Premium35 like Code */
      if (collectionsToApplyIds.length === 1 && collectionsToIgnoreIds.length > 0) {               
        const rulesValidationArray = variant.product.inCollections.map(({ collectionId, isMember }) => {
          if(isMember && collectionsToIgnore.some(collection => collection.id === collectionId)) return false
          
          const matchCollectionFullObject = collectionsToApply.find(collection => collection.id === collectionId);          
          if(
            matchCollectionFullObject && 
            matchCollectionFullObject.checkedState === true && 
            matchCollectionFullObject.radioState === false && 
            variant.metafield?.value !== "true"
          ) return true
                 
        })
        const filteredRulesValidationArray = rulesValidationArray.filter(value => value !== undefined);
        return filteredRulesValidationArray.length > 0 && filteredRulesValidationArray.every((value) => value === true);      
      }
      /* Logic to validate Estetica30 like Code */
      if (collectionsToApplyIds.length > 0 && collectionsToIgnoreIds.length === 1) {
        if (variant.metafield?.value !== "true") {
          const rulesValidationArray = variant.product.inCollections.map(({ collectionId, isMember }) => {
            if(isMember) {
              if (collectionsToIgnoreIds.indexOf(collectionId) > -1) return false
              if (collectionsToIgnoreIds.indexOf(collectionId) === -1) return true
              if (collectionsToApplyIds.indexOf(collectionId) > -1) return true
            }                       
          });         
          
          const filteredRulesValidationArray = rulesValidationArray.filter(value => value !== undefined);          
          return filteredRulesValidationArray.length >= collectionsToApplyIds.length && filteredRulesValidationArray.every((value) => value === true);
        }
      }
               
    });
    
    return result.map((line) => {
      const variant = /** @type {ProductVariant} */ (line.merchandise);
      return /** @type {Target} */ ({
        productVariant: {
          id: variant.id,
        },
      });
    });
  };
  
  const targets = validateDiscount(input.cart.lines, configuration);
  
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

/* 
  1. Colecciones en CollectionsToApply con Metafield diferente de TRUE y en CollectionsToIgnore. (PREMIUM35)
  2. Colecciones en CollectionsToApply o en CollectionsToIgnore con Metafield TRUE.  (SALE25)
  3. Colecciones en CollectionsToApply y en CollectionsToIgnore con Metafield diferente de TRUE. (ESTETICA30)
  [{
    id: "someID",
    imgSrc: "someURL",
    title: "someTitle",
    vendor: "someVendor",
    checkboxState: true,
    radioState: true
  }, {
    id: "someID",
    imgSrc: "someURL",
    title: "someTitle",
    vendor: "someVendor",
    checkboxState: true,
    radioState: true
  }]
  ["gid://shopify/Collection/293047500952","gid://shopify/Collection/293047468184","gid://shopify/Collection/293047337112"]
  INT:  gid://shopify/Collection/293478826136
  INT:  gid://shopify/Collection/293047500952
  INT:  gid://shopify/Collection/293047468184
  INT:  gid://shopify/Collection/293047337112  
*/
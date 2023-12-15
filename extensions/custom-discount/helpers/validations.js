/**
 * @typedef {import("../generated/api").ProductVariant} ProductVariant
 * @typedef {import("../generated/api").Target} Target
 */

const validateDiscounts = (lines, { collectionsToApply, collectionsToIgnore }) => {
    const result = lines.filter((line) => {
      const variant = /** @type {ProductVariant} */ (line.merchandise);
      /* Logic to validate SALE25 like Code */
      if(collectionsToApply.length > 0 && collectionsToIgnore.length == 0) {
        return validateSale25(variant, collectionsToApply)
      }
      /* Logic to validate Premium35 like Code */
      if (collectionsToApply.length === 1 && collectionsToIgnore.length > 0) {
        return validatePremium35(variant, collectionsToIgnore, collectionsToApply)
      }
      /* Logic to validate Estetica30 like Code */
      if (collectionsToApply.length > 0 && collectionsToIgnore.length === 1) {        
        return validateEstetica30(variant, collectionsToApply, collectionsToIgnore)
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

const validateSale25 = (variant, collectionsToApply) => {
    return variant.product.inCollections.map(({ collectionId, isMember }) => {
        const matchCollectionFullObject = collectionsToApply.find(collection => collection.id === collectionId);
        if (isMember) {
          if((matchCollectionFullObject.metafiledValue === null) || (matchCollectionFullObject.metafiledValue === true && variant.metafield?.value === "true")) {
            return true
          }
        }
      }).some((value) => value === true)
};

const validatePremium35 = (variant, collectionsToIgnore, collectionsToApply) => {
    const rulesValidationArray = variant.product.inCollections.map(({ collectionId, isMember }) => {
        if(isMember && collectionsToIgnore.some(collection => collection.id === collectionId)) return false

        const matchCollectionFullObject = collectionsToApply.find(collection => collection.id === collectionId);
        
        if(
          matchCollectionFullObject &&           
          matchCollectionFullObject.metafiledValue === false &&
          variant.metafield?.value !== "true"
        ) return true

      })
      const filteredRulesValidationArray = rulesValidationArray.filter(value => value !== undefined);
      return filteredRulesValidationArray.length > 0 && filteredRulesValidationArray.every((value) => value === true);
};

const validateEstetica30 = (variant, collectionsToApply, collectionsToIgnore) => {    
    if (variant.metafield?.value !== "true") {
        const rulesValidationArray = variant.product.inCollections.map(({ collectionId, isMember }) => {
            if(isMember) {
                if (collectionsToIgnore.includes(collectionId)) return false
                if (!collectionsToIgnore.includes(collectionId)) return true
                if (collectionsToApply.includes(collectionId)) return true
            }
        });

        const filteredRulesValidationArray = rulesValidationArray.filter(value => value !== undefined);
        return filteredRulesValidationArray.length >= collectionsToApply.length && filteredRulesValidationArray.every((value) => value === true);
    }
};



export {
    validateDiscounts
}
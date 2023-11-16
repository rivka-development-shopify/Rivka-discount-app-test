

export const getStackDiscountId = (stackDiscount) => {
  return stackDiscount.replace('gid://shopify/DiscountCodeNode/', '')
}

export const checkIfProductBelongsToPriceRule = (productDetails, priceRule) => {
  const collectionsToApply  = priceRule.collectionsToApply.filter(
    collection => {
      let isAplicable = true
      if(productDetails.collections.includes(collection.id)) {
        if(collection.useMetafield) {
          if(`${productDetails.variant.metafield_twc_sale_item === 'true'?true:false}` !== `${collection.metafiledValue}`) {
            isAplicable = false
          }
        }
      } else {
        isAplicable = false
      }
      return isAplicable
    }
  ).length > 0

  const collectionsToIgnore =  priceRule.collectionsToIgnore.filter(
    collection => {
      let isAplicable = true
      if(productDetails.collections.includes(collection.id)) {
        if(collection.useMetafield) {
          if(`${productDetails.variant.metafield_twc_sale_item === 'true'?true:false}` !== `${collection.metafiledValue}`) {
            isAplicable = false
          }
        }
      } else {
        isAplicable = false
      }
      return isAplicable
    }
  ).length > 0

  const productVariantsToApply =  priceRule.productVariantsToApply.includes(productDetails.variant.id)

  const productVariantsToIgnore =  priceRule.productVariantsToIgnore.includes(productDetails.variant.id)


  return (
    (collectionsToApply && !collectionsToIgnore)
    ||
    (productVariantsToApply && !productVariantsToIgnore)
  )
}

export default {
  getStackDiscountId,
  checkIfProductBelongsToPriceRule
}

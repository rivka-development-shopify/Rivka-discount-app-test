import prisma from "~/db.server"

import {
  getDiscountsRulesByIds,
  getProductsDetails
} from '../services/shopifyAdmin'


export const getStackDiscountId = (stackDiscount) => {
  return stackDiscount.replace('gid://shopify/DiscountCodeNode/', '')
}

export const checkIfProductBelongsToPriceRule = (productDetails, priceRule) => {
  const filterCollection = collection => {
    let isAplicable = true
    if(productDetails.collections.includes(collection.id)) {

      if(collection?.useMetafield || null) {
        if(
          `${(
            productDetails.variant.metafield_twc_sale_item &&
            productDetails.variant.metafield_twc_sale_item === 'true'
            ) ? true : false}`
          !==
          `${collection.metafiledValue}`
        ) {
          isAplicable = false
        }
      }
    } else {
      isAplicable = false
    }
    return isAplicable
  };

  const collectionsToApply  = priceRule.collectionsToApply.filter(filterCollection).length > 0
  const collectionsToIgnore =  priceRule.collectionsToIgnore.filter(filterCollection).length > 0

  const productVariantsToApply =  priceRule.productVariantsToApply.includes(productDetails.variant.id)
  const productVariantsToIgnore =  priceRule.productVariantsToIgnore.includes(productDetails.variant.id)


  return (
    (collectionsToApply && !collectionsToIgnore)
    ||
    (productVariantsToApply && !productVariantsToIgnore)
  )
}

export const getDiscountCodeFromDB = async (code) => {
  // Try to find an exact match
  const exactMatch = await prisma.discountCode.findFirst({
    where: {
      code: code,
    },
  });

  // If an exact match is found, return it immediately
  if (exactMatch) {
    return exactMatch;
  }
  // If no exact match, check for wildcard match
  const wildcardMatches = await prisma.discountCode.findMany({
    where: {
      code: {
        endsWith: "#",
      },
    },
  });

  const wildcardMatch = wildcardMatches.find(discount => code.includes(discount.code.substring(0, discount.code.length - 1)));
  if (wildcardMatch) {
    const wildcardPrefix = wildcardMatch.code.substring(0, wildcardMatch.code.length - 1);
    if (code.startsWith(wildcardPrefix)) {
      wildcardMatch.code = wildcardMatch.code.replace('#', "*");
      return wildcardMatch;
    }
  }

  return null;
};

export const updateDiscountCodeFromDB = async (discountCode) => {
  return await prisma.$transaction([
    prisma.discountCode.update({
      where: {
        id: discountCode.discountCodeId
      },
      data: {
        stackDiscounts: {
          set: [],
        }
      }
    }),
    prisma.discountCode.update({
      where: {
        id: discountCode.discountCodeId
      },
      data: {
        code: discountCode.discountCode,
        stackDiscounts: discountCode.stackDiscounts,
      }
    })
  ])
}

export const getDiscountCodeByIdFromDB = async (discountCodeId) => {
  return await prisma.discountCode.findFirst({
    where: {
      id: discountCodeId
    }
  })
}

export const getAllDiscountCodesFromDB = async () => {
  return await prisma.discountCode.findMany()
}

export const getTempDiscountCodeFromDB = async (code) => {
  return await prisma.tempDiscountCode.findFirst({
    where: {
      code: code
    }
  })
}

export const getProductDiscountedPrices = (productsDetails, stackedPriceRules) => {
  return productsDetails.map( productDetails => {
    const discountsApplied = stackedPriceRules.filter(
      priceRule => {
        return checkIfProductBelongsToPriceRule(
          productDetails,
          priceRule
        )
      }
    )

    const percentage = discountsApplied.reduce(
      (accumulator, currentValue) => accumulator + currentValue.percentage,
      0.0
    );

    return {
      productId: productDetails.id,
      productVariantId: productDetails.variant.id,
      price: productDetails.variant.price.amount * 1.0 * productDetails.quantity,
      discountedPrice: (productDetails.variant.price.amount - (productDetails.variant.price.amount * percentage)) * productDetails.quantity,
      discountApplied: (productDetails.variant.price.amount * percentage) * productDetails.quantity,
      percentageApplied: percentage,
      discountsApplied: discountsApplied.map(discount => discount.title)
    }
  }
)
}

export const calculatePricesForProducts = async (stackedDiscounts, cartProducts) => {
  const stackedPriceRules = await getDiscountsRulesByIds(stackedDiscounts)

  const productsDetails = await getProductsDetails(cartProducts)


  if(productsDetails && stackedPriceRules) {
    const productDiscountedPrices = getProductDiscountedPrices(productsDetails, stackedPriceRules)
    const totalDiscounted = productDiscountedPrices.reduce(
      (accumulator, currentValue) => accumulator + currentValue.discountApplied,
      0.0
    )
    const originalTotal = productDiscountedPrices.reduce(
      (accumulator, currentValue) => accumulator + currentValue.price,
      0.0
    )

    return {
      productDiscountedPrices,
      originalTotal,
      totalDiscounted
    }
  } else {
    return null
  }
}



export default {
  getStackDiscountId,
  checkIfProductBelongsToPriceRule,
  getDiscountCodeFromDB,
  getProductDiscountedPrices,
  updateDiscountCodeFromDB,
  getDiscountCodeByIdFromDB,
  getAllDiscountCodesFromDB
}

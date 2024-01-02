import shopify, { authenticate, sessionStorage } from "../shopify.server";
import { getDatabaseSession } from '../models/session'

export const getProductsDetails = async (products) => {
  const databaseSession = await getDatabaseSession()
  const { storefront } = await shopify.unauthenticated.storefront(databaseSession.shop)

  return Promise.all(
    products.map(async ({productId, productVariantId, quantity}) => {
      try {
        const graphqlProductFormData = await storefront.graphql(`
          query {
            product(id: "${productId}") {
              title
              collections(first: 250) {
                edges {
                  node {
                    id
                  }
                }
              }
              variants (first: 250) {
                edges {
                  node {
                    id
                    price {
                      amount
                      currencyCode
                    }
                    metafield (namespace: "twc", key: "sale_item") {
                      value
                    }
                  }
                }
              }
            }
          }
        `)
        const { data: { product: grahqlProduct } } = await graphqlProductFormData.json()

        return {
          id: productId,
          title: grahqlProduct.title,
          collections: grahqlProduct.collections.edges.map(({node}) => node.id),
          variant: grahqlProduct.variants.edges.map(({node}) => ({
            id: node.id,
            metafield_twc_sale_item: node.metafield?.value ?? null,
            price: node.price
          })).find(variant => variant.id === productVariantId),
          quantity: parseInt(quantity)
        }
      } catch(e) {
        console.error({
          err: 'On storefront graphql product request',
          msg: e
        })
        return null
      }
    })
  )
}

export const getDiscountsRulesByIds = async (stackDiscounts) => {
  const databaseSession = await getDatabaseSession()
  const { admin } = await shopify.unauthenticated.admin(databaseSession.shop)

  return Promise.all(
    stackDiscounts.map(async (UI_discountId) => {
      try {
        const graphqlDiscountFormData = await admin.graphql(`
            #graphql
              query GetDiscount($id: ID!) {
              discountNode(id: $id) {
                id
                configurationField: metafield(
                  namespace: "$app:sku-discount"
                  key: "function-configuration"
                ) {
                  id
                  value
                }
                discount {
                  __typename
                  ... on DiscountCodeApp {
                    title
                    combinesWith {
                      orderDiscounts
                      productDiscounts
                      shippingDiscounts
                    }
                    startsAt
                    endsAt
                    usageLimit
                    appliesOncePerCustomer
                    codes(first: 1) {
                      nodes {
                        code
                      }
                    }
                  }
                  ... on DiscountCodeBasic {
                    title
                    status
                    combinesWith {
                      orderDiscounts
                      productDiscounts
                      shippingDiscounts
                    }
                    startsAt
                    endsAt
                    usageLimit
                    appliesOncePerCustomer
                    codes(first: 1) {
                      nodes {
                        code
                      }
                    }
                    customerGets {
                      items {
                        ... on AllDiscountItems {
                          __typename
                          allItems
                        }
                        ... on DiscountProducts {
                          __typename
                          productVariants(first: 100) {
                            nodes {
                              id
                            }
                          }
                        }
                        ... on DiscountCollections {
                          __typename
                          collections(first: 100) {
                            nodes {
                              id
                            }
                          }
                        }
                      }
                      value {
                        ... on DiscountPercentage {
                          __typename
                          percentage
                        }
                        ... on DiscountOnQuantity {
                          __typename
                          effect {
                            ... on DiscountPercentage {
                              __typename
                              percentage
                            }
                          }
                          quantity {
                            quantity
                          }
                        }
                        ... on DiscountAmount {
                          __typename
                          amount {
                            amount
                            currencyCode
                          }
                          appliesOnEachItem
                        }
                      }
                    }
                  }
                }
              }
            }
        `,
        {
          variables: {
            id: UI_discountId,
          }
        })
        const a = await graphqlDiscountFormData.json()
        const { data: { discountNode: grahqlDiscountNode } } = a



        let discountNode = {};
        let discountNodeConfiguration = {};


        switch(grahqlDiscountNode.discount.__typename) {
          case 'DiscountCodeApp':
            discountNodeConfiguration = JSON.parse(grahqlDiscountNode.configurationField.value)
            discountNode = {
              type: 'App',
              title: grahqlDiscountNode.discount.title,
              code: grahqlDiscountNode.discount.codes.nodes.length > 0 ? grahqlDiscountNode.discount.codes.nodes[0].code : grahqlDiscountNode.discount.title,
              appliesOncePerCustomer: grahqlDiscountNode.discount.appliesOncePerCustomer,
              usageLimit: grahqlDiscountNode.discount.usageLimit,
              startsAt: grahqlDiscountNode.discount.startsAt,
              endsAt: grahqlDiscountNode.discount.endsAt,
              combinesWith: grahqlDiscountNode.discount.combinesWith,

              percentage: discountNodeConfiguration.percentage / 100.0,
              minQuantity: discountNodeConfiguration.quantity === 0 ? null : discountNodeConfiguration.quantity,
              collectionsToApply: discountNodeConfiguration.collectionsToApply,
              collectionsToIgnore: discountNodeConfiguration.collectionsToIgnore,
              productVariantsToApply: [],
              productVariantsToIgnore: [],
            }
          break;
          case 'DiscountCodeBasic':
            discountNodeConfiguration = {
              percentage: grahqlDiscountNode.discount.customerGets.value.percentage,
              collectionsToApply: [],
              productVariantsToApply: []
            }
            switch(grahqlDiscountNode.discount.customerGets.items.__typename) {
              case 'DiscountCollections':
                discountNodeConfiguration.collectionsToApply = grahqlDiscountNode.discount.customerGets.items.collections.nodes.map(collection => ({id: collection.id}))
              break;
              case 'DiscountProducts':
                discountNodeConfiguration.productVariantsToApply = grahqlDiscountNode.discount.customerGets.items.productVariants.nodes.map(variant => variant.id)
              break;
            }

            discountNode = {
              type: 'Product Percentage',
              title: grahqlDiscountNode.discount.title,
              code: grahqlDiscountNode.discount.codes.nodes.length > 0 ? grahqlDiscountNode.discount.codes.nodes[0].code : grahqlDiscountNode.discount.title,
              appliesOncePerCustomer: grahqlDiscountNode.discount.appliesOncePerCustomer,
              usageLimit: grahqlDiscountNode.discount.usageLimit,
              startsAt: grahqlDiscountNode.discount.startsAt,
              endsAt: grahqlDiscountNode.discount.endsAt,
              combinesWith: grahqlDiscountNode.discount.combinesWith,

              minQuantity: null,
              percentage: discountNodeConfiguration.percentage,
              collectionsToIgnore: [],
              collectionsToApply: discountNodeConfiguration.collectionsToApply,
              productVariantsToApply: discountNodeConfiguration.productVariantsToApply,
              productVariantsToIgnore: [],
            }
          break;
        }

        return discountNode
      } catch(e) {
        console.error({
          err: 'On ADMIN graphql discount code request',
          msg: e
        })
        return null
      }
    })
  )
}

export const deleteTempDiscountById = async (shopifyTempDiscountId) => {
  const databaseSession = await getDatabaseSession()
  const { admin } = await shopify.unauthenticated.admin(databaseSession.shop)

  try {
    const graphqlDiscountFormData = await admin.graphql(
      `mutation discountCodeDelete($id: ID!) {
        discountCodeDelete(id: $id) {
          userErrors {
            field
            code
            message
          }
        }
      }`,
      {
        variables: {
          "id": shopifyTempDiscountId
        }
      }
    )

    const { data: { discountCodeDelete: { userErrors }} } = await graphqlDiscountFormData.json()

    if(userErrors.length === 0) {
      return {
        shopifyTempDiscountId,
        userErrors
      }
    } else {
      throw userErrors
    }
  } catch(e) {
    console.error({
      err: 'On deleting discount graphql request',
      msg: e
    })
    return null
  }
}

export const createNewTempDiscount = async (shopifyTempDiscount) => {
  const databaseSession = await getDatabaseSession()
  const { admin } = await shopify.unauthenticated.admin(databaseSession.shop)

  try {
    const graphqlDiscountFormData = await admin.graphql(
      `mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          "basicCodeDiscount": {
            "appliesOncePerCustomer": true,
            "code": shopifyTempDiscount.code,
            "combinesWith": {
              "orderDiscounts": true,
              "productDiscounts": true,
              "shippingDiscounts": true
            },
            "customerGets": {
              "items": {
                "all": true
              },
              "value": {
                "discountAmount": {
                  "amount": shopifyTempDiscount.amount,
                  "appliesOnEachItem": false
                }
              }
            },
            "customerSelection": {
              "all": true
            },
            "endsAt": null,
            "minimumRequirement": {
              "quantity": {
                "greaterThanOrEqualToQuantity": `${shopifyTempDiscount.minQuantity}`
              }
            },
            "startsAt": shopifyTempDiscount.startsAt,
            "title": shopifyTempDiscount.title,
            "usageLimit": 1
          }
        }
      }
    )
    const { data: { discountCodeBasicCreate: { userErrors, codeDiscountNode }} } = await graphqlDiscountFormData.json()

    if(userErrors.length === 0) {
      return {
        id: codeDiscountNode.id,
        endsAt: shopifyTempDiscount.endsAt,
        amount: shopifyTempDiscount.amount,
        code: shopifyTempDiscount.code
      }
    } else {
      throw userErrors
    }
  } catch(e) {
    console.error({
      err: 'On creating temp discount graphql request',
      msg: e
    })
    return null
  }
}

export const updateTempDiscountById = async (shopifyTempDiscountId, shopifyTempDiscount) => {
  const databaseSession = await getDatabaseSession()
  const { admin } = await shopify.unauthenticated.admin(databaseSession.shop)

  try {
    const graphqlDiscountFormData = await admin.graphql(
      `mutation discountCodeBasicUpdate($basicCodeDiscount: DiscountCodeBasicInput!, $id: ID!) {
        discountCodeBasicUpdate(basicCodeDiscount: $basicCodeDiscount, id: $id) {
          codeDiscountNode {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          "id": shopifyTempDiscountId,
          "basicCodeDiscount": {
            "customerGets": {
              "value": {
                "discountAmount": {
                  "amount": shopifyTempDiscount.amount,
                  "appliesOnEachItem": false
                }
              }
            },
            "combinesWith": {
              "orderDiscounts": true,
              "productDiscounts": true,
              "shippingDiscounts": true
            },
            "minimumRequirement": {
              "quantity": {
                "greaterThanOrEqualToQuantity": `${shopifyTempDiscount.minQuantity}`
              }
            },
            "startsAt": shopifyTempDiscount.startsAt,
            "endsAt": shopifyTempDiscount.endsAt
          },
        }
      }
    )
    const { data: { discountCodeBasicUpdate: { userErrors, codeDiscountNode }} } = await graphqlDiscountFormData.json()

    if(userErrors.length === 0) {
      return {
        id: codeDiscountNode.id,
        endsAt: shopifyTempDiscount.endsAt,
        amount: shopifyTempDiscount.amount,
        code: shopifyTempDiscount.code
      }
    } else {
      throw userErrors
    }
  } catch(e) {
    console.error({
      err: 'On updating temp discount graphql request',
      msg: e
    })
    return null
  }
}

export const checkForNativeDiscount = async (code) => {
  const databaseSession = await getDatabaseSession()
  const { admin } = await shopify.unauthenticated.admin(databaseSession.shop)

  try {
    const graphqlDiscountFormData = await admin.graphql(
      `
      query GetDiscount {
        codeDiscountNodeByCode(code: "${code}") {
          id
        }
      }
      `
    )
    const { data: { codeDiscountNodeByCode } } = await graphqlDiscountFormData.json()

    return codeDiscountNodeByCode?.id ?? null
  } catch(e) {
    console.error({
      err: 'On creating checking native graphql request',
      msg: e
    })
    return null
  }
}

export const getDiscounts = async (request, retrievedDiscounts = []) => {
  const { admin } = await shopify.authenticate.admin(request);
  let cursor = ''
  if(retrievedDiscounts.length > 0) {
    cursor = `after: "${retrievedDiscounts.at(-1).cursor}", `
  }

  const response = await admin.graphql(
    `#graphql
      query {
        discountNodes(first: 50, ${cursor} reverse: true) {
          edges {
            cursor
            node {
              id
              events(first: 1) {
                edges {
                  node {
                    id
                    __typename
                    ... on BasicEvent {
                      id
                      appTitle
                    }
                  }
                }
              }
              discount {
                __typename
                ... on DiscountCodeFreeShipping {
                  title
                  status
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
                ... on DiscountCodeBxgy {
                  title
                  status
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
                ... on DiscountCodeBasic {
                  title
                  status
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
                ... on DiscountCodeApp {
                  title
                  status
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
  );

  const rawDiscounts = await response.json();

  let acumulatedDiscounts;
  if(retrievedDiscounts.length > 0) {
    acumulatedDiscounts = [...retrievedDiscounts, ...rawDiscounts.data.discountNodes.edges]
  } else {
    acumulatedDiscounts = rawDiscounts.data.discountNodes.edges
  }


  if(rawDiscounts.data.discountNodes.edges.length < 50) {
    return acumulatedDiscounts
  } else {
    return await getDiscounts(request, acumulatedDiscounts)
  }
}

export default {
  getProductsDetails,
  getDiscountsRulesByIds,
  deleteTempDiscountById,
  createNewTempDiscount,
  updateTempDiscountById,
  checkForNativeDiscount
}

// @ts-nocheck
import { json, redirect } from "@remix-run/node";
import shopify, { authenticate, sessionStorage } from "../shopify.server";
import prisma from "../db.server";

import { cors } from 'remix-utils/cors';

const getStackDiscountId = (stackDiscount) => {
  return stackDiscount.replace('gid://shopify/DiscountCodeNode/', '')
}

export const action = async ({ request }) => {

  if(request.method === 'POST') {
    try {
      const body = await request.json()
      if(
        !body.addedCode || !body.cartProducts
      ) {
        throw {
          type: 'IncorrectBody',
        }
      }


      const databaseSession = await prisma.session.findFirst()
      const { admin, session: adminSession } = await shopify.unauthenticated.admin(databaseSession.shop)
      const { storefront } = await shopify.unauthenticated.storefront(databaseSession.shop)

      const UI_discountCode = await prisma.discountCode.findFirst({
        where: {
          code: body.addedCode
        }
      })

      if(!UI_discountCode) {
        throw {
          type: 'InexistentDiscountCode',
        }
      }


      const stackedPriceRules = await Promise.all(
        UI_discountCode.stackDiscounts.map(async (UI_discountId) => {
          try {
            const graphqlDiscountFormData = await admin.graphql(`
                query GetDiscount {
                  discountNode(id: "${UI_discountId}") {
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
            `)
            const { data: { discountNode: grahqlDiscountNode } } = await graphqlDiscountFormData.json()

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
                  collectionsToApply: discountNodeConfiguration.belongsToCollectionIds,
                  collectionsToIgnore: discountNodeConfiguration.notBelongsToCollectionIds,
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
                    discountNodeConfiguration.collectionsToApply = grahqlDiscountNode.discount.customerGets.items.collections.nodes.map(collection => collection.id)
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
              err: 'On storefront graphql discount code request',
              msg: e
            })
            return null
          }
        })
      )


      const productsDetails = await Promise.all(
        body.cartProducts.map(async ({productId, productVariantId}) => {
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
              title: grahqlProduct.title,
              collections: grahqlProduct.collections.edges.map(({node}) => node.id),
              variant: grahqlProduct.variants.edges.map(({node}) => ({
                id: node.id,
                metafield_twc_sale_item: node.metafield?.value || null,
                price: node.price
              })).find(variant => variant.id === productVariantId)
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

      const response = json(
        {
          body: {
            data: {
              stackedPriceRules
            }
          }
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return await cors(request, response);
    }
    catch(e) {
      if(e.type) {
        switch(e.type){
          case 'InexistentDiscountCode':
          case 'IncorrectBody':
            console.error(e)
            const response = json(
              {
                body: {
                  data: {
                    err: 'Bad Request'
                  }
                }
              },
              {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            return await cors(request, response);
            break;
        }
      } else {
        console.error({
          err: "API Error calculating price discount for bundle",
          msg: e
        })
        const response = json(
          {
            body: {
              data: {
                err: 'Internal Server Error'
              }
            }
          },
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        return await cors(request, response);
      }
    }

  } else {
    const response = json(
      {
        body: {
          data: {
            err: 'Bad Request'
          }
        }
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return await cors(request, response);
  }
};




export const loader = async ({ request }) => {
  const response = json(
    {
      body: {
        data: {
          err: 'Bad Request'
        }
      }
    },
    {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return await cors(request, response);
}

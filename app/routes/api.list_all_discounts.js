// @ts-nocheck
import { json, redirect } from "@remix-run/node";
import shopify, { authenticate, sessionStorage } from "../shopify.server";
import prisma from "../db.server";

import { cors } from 'remix-utils/cors';


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

      // return json(UI_discountCode, {status: 200})
      const getStackDiscountId = (stackDiscount) => {
        return stackDiscount.replace('gid://shopify/DiscountCodeNode/', '')
      }

      UI_discountCode.stackDiscountsIds = UI_discountCode.stackDiscounts.map(stackDiscount => getStackDiscountId(stackDiscount))


      const graphqlPriceRulesFormData = await admin.rest.resources.DiscountCode.all({
        session: adminSession,
      })

      const { data: priceRules } = graphqlPriceRulesFormData

      const stackedPriceRules = priceRules


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

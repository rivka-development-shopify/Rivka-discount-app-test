// @ts-nocheck
import { json, redirect } from "@remix-run/node";
import shopify, { authenticate, sessionStorage } from "../shopify.server";
import prisma from "../db.server";

import { randomKey } from '../utils/random'

import {
  createNewTempDiscount,
  deleteTempDiscountById
} from '../services/shopifyAdmin'

import {
  getDiscountsRulesByIds,
  getProductsDetails
} from '../services/shopifyAdmin'

import {
  checkIfProductBelongsToPriceRule
} from '../utils/discounts'

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

      const stackedPriceRules = await getDiscountsRulesByIds(UI_discountCode.stackDiscounts)

      const productsDetails = await getProductsDetails(body.cartProducts)

      const productDiscountedPrices = productsDetails.map( productDetails => {
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
            price: productDetails.variant.price.amount * 1.0,
            discountedPrice: productDetails.variant.price.amount - productDetails.variant.price.amount * percentage,
            discountApplied: productDetails.variant.price.amount * percentage,
            percentageApplied: percentage,
            discountsApplied: discountsApplied.map(discount => discount.title)
          }
        }
      )

      const totalDiscounted = productDiscountedPrices.reduce(
        (accumulator, currentValue) => accumulator + currentValue.discountApplied,
        0.0
      )
      const originalTotal = productDiscountedPrices.reduce(
        (accumulator, currentValue) => accumulator + currentValue.price,
        0.0
      )

      const discountRandomKey = randomKey(8)

      const newTempDiscountInfo = await createNewTempDiscount({
        code: `TEMP-${body.addedCode}-${discountRandomKey}`,
        title: `TEMPORARY ${body.addedCode} DISCOUNT | ${discountRandomKey}`,
        amount: totalDiscounted,
        minimumRequirement: originalTotal,
        startsAt: new Date,
        endsAt: new Date(new Date().getTime() + 86400000)
      })

      const response = json(
        {
          body: {
            data: {
              productDiscountedPrices,
              totalDiscounted,
              newTempDiscountInfo
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

import { json } from "@remix-run/node";
import prisma from "../db.server";

import { randomKey } from '../utils/random'

import {
  createNewTempDiscount,
  updateTempDiscountById,
  deleteTempDiscountById
} from '../services/shopifyAdmin'


import {
  calculatePricesForProducts,
  getDiscountCodeFromDB,
  getTempDiscountCodeFromDB
} from '../utils/discounts'

import { validateAuthKeyParam } from '../utils/publicAuthKey'

const validateBodyForDiscountInput = (body) => {
  return (!body.addedCode || !body.cartProducts)
}

export const createTempDiscount = async (body) => {
  try {
    if (validateBodyForDiscountInput(body)){
      throw {
        type: 'IncorrectBody',
      }
    }

    const UI_discountCode = await getDiscountCodeFromDB(body.addedCode)
    if(!UI_discountCode) {
      throw {
        type: 'InexistentDiscountCode',
      }
    }

    const newPricesForProducts = await calculatePricesForProducts(
      UI_discountCode.stackDiscounts,
      body.cartProducts
    )

    if(!newPricesForProducts) {
      throw 'Error calculating prices for products'
    }

    const {
      productDiscountedPrices,
      originalTotal,
      totalDiscounted
    } = newPricesForProducts;

    const discountRandomKey = randomKey(8)

    const newTempDiscountInfo = await createNewTempDiscount({
      code: `TEMP-${body.addedCode}-${discountRandomKey}`,
      title: `TEMPORARY ${body.addedCode} DISCOUNT | ${discountRandomKey}`,
      amount: totalDiscounted,
      minimumRequirement: originalTotal,
      startsAt: new Date,
      endsAt: new Date(new Date().getTime() + 86400000)
    })

    if(!newTempDiscountInfo) {
      throw 'Error creating temporary discount on Shopify Admin'
    }

    const tempDiscountCreateResponse = await prisma.tempDiscountCode.create({
      data:{
        shopify_id: newTempDiscountInfo.id,
        code: newTempDiscountInfo.code,
        refered_code: body.addedCode,
        endsAt: newTempDiscountInfo.endsAt,
        amount: newTempDiscountInfo.amount,
      }
    })

    if(!tempDiscountCreateResponse) {
      throw 'Error inserting temporary discount on DB'
    }

    return json(
      {
        body: {
          data: {
            productDiscountedPrices,
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
  }
  catch(e) {
    if(e.type) {
      switch(e.type){
        case 'InexistentDiscountCode':
        case 'IncorrectBody':
          console.error(e)
          return json(
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
          break;
      }
    } else {
      console.error({
        err: "API Error calculating price discount for bundle",
        msg: e
      })
      return json(
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
    }
  }
}

export const updateTempDiscount = async (body) => {
  try {
    if (validateBodyForDiscountInput(body)){
      throw {
        type: 'IncorrectBody',
      }
    }

    const tempDiscountCode = await getTempDiscountCodeFromDB(body.addedCode)
    if(!tempDiscountCode) {
      throw {
        type: 'InexistentDiscountCode',
      }
    }

    const UI_discountCode = await getDiscountCodeFromDB(tempDiscountCode.refered_code)
    if(!UI_discountCode) {
      throw {
        type: 'InexistentReferedDiscountCode',
      }
    }

    const newPricesForProducts = await calculatePricesForProducts(
      UI_discountCode.stackDiscounts,
      body.cartProducts
    )

    if(!newPricesForProducts) {
      throw 'Error calculating prices for products'
    }

    const {
      productDiscountedPrices,
      originalTotal,
      totalDiscounted
    } = newPricesForProducts;

    const newTempDiscountInfo = await updateTempDiscountById(
      tempDiscountCode.shopify_id,
      {
        code: totalDiscounted,
        amount: totalDiscounted,
        minimumRequirement: originalTotal,
        startsAt: new Date,
        endsAt: new Date(new Date().getTime() + 86400000)
      }
    )

    if(!newTempDiscountInfo) {
      throw 'Error updating temporary discount on Shopify Admin'
    }

    const tempDiscountCreateResponse = await prisma.tempDiscountCode.update({
      where: {
        id: tempDiscountCode.id
      },
      data: {
        shopify_id: newTempDiscountInfo.id,
        endsAt: newTempDiscountInfo.endsAt,
        amount: newTempDiscountInfo.amount
      }
    })

    if(!tempDiscountCreateResponse) {
      throw 'Error updating temporary discount on DB'
    }

    return json(
      {
        body: {
          data: {
            productDiscountedPrices,
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
  }
  catch(e) {
    if(e.type) {
      switch(e.type){
        case 'InexistentDiscountCode':
        case 'IncorrectBody':
          console.error(e)
          return json(
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
          break;
      }
    } else {
      console.error({
        err: "API Error updating price discount for bundle",
        msg: e
      })
      return json(
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
    }
  }
}

export async function deleteExpiredDiscounts(request) {
  try {
    if(!validateAuthKeyParam(request.url)) {
      throw {
        type: 'IncorrectAuthKey'
      }
    }
    const allDiscounts = await prisma.tempDiscountCode.findMany({})

    const expiredDiscounts = allDiscounts.filter(
      discount => {
        return discount.endsAt < new Date
      }
    )

    const expiredDiscountsIds = Promise.all(
      expiredDiscounts.map(
        async expiredDiscount => {
          try {
            const { userErrors } = await deleteTempDiscountById(expiredDiscount.shopify_id)
            if(userErrors.length === 0) {
              await prisma.tempDiscountCode.deleteMany({
                where: {
                  id: expiredDiscount.id
                }
              })
              return expiredDiscount
            }
          } catch(e) {
            console.error({
              msg: 'Error deleting expired discounts',
              err: e
            })
            return null
          }
        }
      )
    )

    return expiredDiscountsIds;
  } catch(e) {
    if(e.type) {
      switch(e.type){
        case 'IncorrectAuthKey':
          console.error(e)
          return json(
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
          break;
      }
    } else {
      console.error({
        err: "API Error deleting expired discounts price discount for bundle",
        msg: e
      })
      return json(
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
    }
  }
}

export default {
  createTempDiscount,
  updateTempDiscount,
  deleteExpiredDiscounts
}
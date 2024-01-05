import { json } from "@remix-run/node";
import prisma from "../db.server";

import { randomKey } from '../utils/random'

import {
  createNewTempDiscount,
  updateTempDiscountById,
  deleteTempDiscountById,
  checkForNativeDiscount
} from '../services/shopifyAdmin'


import {
  calculatePricesForProducts,
  getTempDiscountCodeFromDB,
  getDiscountCodeFromDB,
  getAllTempDiscountCodesFromDB
} from '../models/discounts'

import { validateAuthKeyParam } from '../utils/publicAuthKey'

const validateBodyForDiscountInput = (body) => {
  return (!body.addedCode || !body.cartProducts)
}

export const getAllTempDiscounts = async (body) => {
  try {
    const tempDiscounts = await getAllTempDiscountCodesFromDB()
    return json(
      {
        body: {
          data: {
            tempDiscounts: tempDiscounts.map(tempDiscount => tempDiscount.code),
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
    console.error({
      err: "API Error getting temp discounts",
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

export const createTempDiscount = async (body) => {
  try {
    if (validateBodyForDiscountInput(body)){
      throw {
        type: 'IncorrectBody',
      }
    }

    let stackDiscounts = [];
    const UI_discountCode = await getDiscountCodeFromDB(body.addedCode)
    if(!UI_discountCode) {
      const nativeDiscountId = await checkForNativeDiscount(body.addedCode)
      if(!nativeDiscountId) {
        throw {
          type: 'InexistentDiscountCode',
        }
      }

      stackDiscounts = [nativeDiscountId];
    } else {
      if(!UI_discountCode.enabled) {
        throw {
          type: 'DiscountCodeNotAllowed',
        }
      }
      stackDiscounts = UI_discountCode.stackDiscounts;
    }

    const newPricesForProducts = await calculatePricesForProducts(
      stackDiscounts,
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
      minQuantity: body.cartProducts.reduce((total, product) => (total + product.quantity), 0),
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
        case 'DiscountCodeNotAllowed':
          return json(
            {
              body: {
                data: {
                  err: 'DiscountCode not Allowed'
                }
              }
            },
            {
              status: 404,
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

    let stackDiscounts = [];
    const UI_discountCode = await getDiscountCodeFromDB(tempDiscountCode.refered_code)
    if(!UI_discountCode) {
      const nativeDiscountId = await checkForNativeDiscount(tempDiscountCode.refered_code)
      if(!nativeDiscountId) {
        throw {
          type: 'InexistentDiscountCode',
        }
      }

      stackDiscounts = [nativeDiscountId];
    } else {
      if(!UI_discountCode.enabled) {
        throw {
          type: 'DiscountCodeNotAllowed',
        }
      }
      stackDiscounts = UI_discountCode.stackDiscounts;
    }

    const newPricesForProducts = await calculatePricesForProducts(
      stackDiscounts,
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
        code: tempDiscountCode.code,
        amount: totalDiscounted,
        minQuantity: body.cartProducts.reduce((total, product) => (total + product.quantity), 0),
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
    const allDiscounts = await getAllTempDiscountCodesFromDB();

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
  deleteExpiredDiscounts,
  getAllTempDiscounts
}

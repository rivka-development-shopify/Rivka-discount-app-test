import prisma from "~/db.server";
// import { Product } from "@prisma/client";
/**
 *
 * THIS HERE WILL MAKE THE DB CONNECTIONS AND WE WILL REQUEST TO THE GRAPHQL API TO THE SHOPIFY FUNCTIONS
 */
export async function deleteDiscountCode(discountCodeId) {
  // delete a discount code by id from the db and then the shopify discount generated for this code
  // requires extention
  try {
    await prisma.discountCode.delete({
      where: {
        id: discountCodeId
      }
    })
    return true;
  } catch (e) {
    console.error({msg: 'Error creating new discount code', err: e})
    return null;
  }
}

export async function createNewDiscountCode(requestArgs) {
  // create default discount code and then updates the shopify discount generated for this code if necessary
  // requires extention
  try {
    return await prisma.discountCode.create({
      data:{
        "code": "NEWDISCOUNT",
        "enabled": false,
        "stackDiscounts": [],
      }
    })
  } catch (e) {
    console.error({msg: 'Error creating new discount code', err: e})
    return null;
  }
}

export async function updateDiscountCode(discountCode) {
  // updates a discount code by id
  // requires extention
  try {
    const response = await prisma.$transaction([
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
    return response;

  } catch (e) {
    console.error({msg: 'Error updating new discount code', err: e})
    return null;
  }
}

export async function toggleDiscountCode(discountCodeId, value) {
  // changes enabled value by discount code id
  // requires extention
  try {
    const repsonse  = await prisma.discountCode.update({
      where: {
        id: discountCodeId
      },
      data: {
        enabled: value === 'true',
      },
    })
    return repsonse;
  } catch (e) {
    console.error({msg: 'Error updating enable property new discount code', err: e})
    return null;
  }
}

export async function getAllDiscountCodes() {
  // returns all discount codes in the db
  // only db
  try {
    return await prisma.discountCode.findMany()
  } catch (e) {
    console.error({msg: 'Error getting discount codes from database', err: e})
    return null;
  }
}

export async function getDiscountCodeById(discountCodeId) {
  // returns a discount code in the db with the given id
  // only db
  try {
    const discountCode = await prisma.discountCode.findFirst({
      where: {
        id: discountCodeId // theres a bug in here
      }
    })
    return discountCode
  } catch (e) {
    console.error({msg: 'Error getting discount codes from database', err: e})
    return null;
  }
}

export default {
  deleteDiscountCode,
  createNewDiscountCode,
  updateDiscountCode,
  toggleDiscountCode,
  getAllDiscountCodes
}

import {
  createNewTempDiscount,
  deleteTempDiscountById
} from '../services/shopifyAdmin'

export async function createTempDiscount(body) {
  try {
    const newTempDiscountInfo = await createNewTempDiscount({
      code: 'TEMP-12345678',
      title: 'TEMP DISCOUNT TEST [SALE25, PREMIUM35]',
      amount: 200.00,
      minimumRequirement: 600.00,
      startsAt: new Date,
      endsAt: null
    })
    return newTempDiscountInfo;
  } catch (e) {
    console.error({msg: 'Error creating temp discount', err: e})
    return null;
  }
}

export async function deleteTempDisocunt(body) {
  try {
    const deletedTempDiscountInfo = await deleteTempDiscountById("gid://shopify/DiscountCodeNode/1083223507096")
    return deletedTempDiscountInfo;
  } catch (e) {
    console.error({msg: 'Error deleting temp discount', err: e})
    return null;
  }
}

export default {
  createTempDiscount,
  deleteTempDisocunt
}

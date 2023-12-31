import prisma from "~/db.server";
import { randomKey } from '../utils/random'
/**
 *
 * THIS HERE WILL MAKE THE DB CONNECTIONS AND WE WILL REQUEST TO THE GRAPHQL API TO THE SHOPIFY FUNCTIONS
 */
export async function getPublicAuthKeys() {
  // delete a discount code by id from the db and then the shopify discount generated for this code
  // requires extention
  try {
    return await prisma.publicAuthKey.findMany()
  } catch (e) {
    console.error({msg: 'Error getting public auth key', err: e})
    return null;
  }
}
export async function getPublicAuthKeyByKey(key) {
  // delete a discount code by id from the db and then the shopify discount generated for this code
  // requires extention
  try {
    return await prisma.publicAuthKey.findUniqueOrThrow({
      where: {
        key: key
      }
    })
  } catch (e) {
    console.error({msg: 'Error getting public auth key', err: e})
    return null;
  }
}

export async function createPublicAuthKey(authKey) {
  // delete a discount code by id from the db and then the shopify discount generated for this code
  // requires extention
  try {

    return await prisma.publicAuthKey.create({
      data: {
        key: randomKey(32)
      }
    })
  } catch (e) {
    console.error({msg: 'Error creating public auth key', err: e})
    return null;
  }
}


export async function deletePublicAuthKey(authKeyId) {
  // delete a discount code by id from the db and then the shopify discount generated for this code
  // requires extention
  try {
    await prisma.publicAuthKey.delete({
      where: {
        id: authKeyId
      }
    })
    return true
  } catch (e) {
    console.error({msg: 'Error deleting public auth key', err: e})
    return null;
  }
}

export default {
  getPublicAuthKeys,
}

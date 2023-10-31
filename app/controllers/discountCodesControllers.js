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
      },
      include: {
        productsToApply: true,
        collectionsToApply: true,
        productsToIgnore: true,
        collectionsToIgnore: true
      },
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
        "productsToApply": {
          create: []
        },
        "collectionsToApply": {
          create: []
        },
        "productsToIgnore": {
          create: []
        },
        "collectionsToIgnore": {
          create: []
        },
      },
      include: {
        productsToApply: true,
        collectionsToApply: true,
        productsToIgnore: true,
        collectionsToIgnore: true
      },
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
    // clearing the old products
    // IT NEEDS TO BE OPTIMIZED
    // just delets the relations we'll have a bunch of repeated products, variants and images
    // we can update it conditionally
    const response = await prisma.$transaction([
      prisma.discountCode.update({
        where: {
          id: discountCode.discountCodeId
        },
        data: {
          stackDiscounts: {
            set: [],
          },
          productsToApply: {
            set: [],
          },
          productsToIgnore: {
            set: [],
          },
          collectionsToApply: {
            set: [],
          },
          collectionsToIgnore: {
            set: [],
          },
        },
        include: {
          productsToApply: true,
          productsToIgnore: true,
          collectionsToApply: true,
          collectionsToIgnore: true,
        },
      }),
      prisma.discountCode.update({
        where: {
          id: discountCode.discountCodeId
        },
        data: {
          code: discountCode.discountCode,
          stackDiscounts: discountCode.stackDiscounts,
          productsToApply: {
            create: discountCode.productsToApply.map(
              product => (
                {
                  shopify_id: product.shopify_id,
                  title: product.title,
                  variants: {
                    create: product.variants.map(
                      variant => ({
                        shopify_id: variant.shopify_id,
                        displayName: variant.displayName,
                      })
                    )
                  },
                  image: {
                    create: {
                      originalSrc: product.image.originalSrc,
                      altText: product.image.altText
                    }
                  }
                }
              )
            )
          },
          productsToIgnore: {
            create: discountCode.productsToIgnore.map(
              product => (
                {
                  shopify_id: product.shopify_id,
                  title: product.title,
                  variants: {
                    create: product.variants.map(
                      variant => ({
                        shopify_id: variant.shopify_id,
                        displayName: variant.displayName,
                      })
                    )
                  },
                  image: {
                    create: {
                      originalSrc: product.image.originalSrc,
                      altText: product.image.altText
                    }
                  }
                }
              )
            )
          },
          collectionsToApply: {
            create: discountCode.collectionsToApply.map(
              collection => {
                const newCollection = {
                  shopify_id: collection.shopify_id,
                  title: collection.title,
                }

                if (collection.image) {
                  newCollection.image = {
                    create: {
                      originalSrc: collection.image.originalSrc,
                      altText: collection.image.altText
                    }
                  }
                }

                return newCollection
              }
            )
          },
          collectionsToIgnore: {
            create: discountCode.collectionsToIgnore.map(
              collection => {
                const newCollection = {
                  shopify_id: collection.shopify_id,
                  title: collection.title,
                }

                if (collection.image) {
                  newCollection.image = {
                    create: {
                      originalSrc: collection.image.originalSrc,
                      altText: collection.image.altText
                    }
                  }
                }

                return newCollection
              }
            )
          }
        },
        include: {
          productsToApply: {
            include: {
              variants: true,
              image: true
            }
          },
          productsToIgnore: {
            include: {
              variants: true,
              image: true
            }
          },
          collectionsToApply: {
            include: {
              image: true
            }
          },
          collectionsToIgnore: {
            include: {
              image: true
            }
          }
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
      },
      include: {
        productsToApply: {
          include: {
            variants: true,
            image: true
          }
        },
        productsToIgnore: {
          include: {
            variants: true,
            image: true
          }
        },
        collectionsToApply: {
          include: {
            image: true
          }
        },
        collectionsToIgnore: {
          include: {
            image: true
          }
        }
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

import prisma from "~/db.server"

export const getShop = async () => {
  const databaseSession = await prisma.session.findFirst({
    where: {
      shop: process.env.SHOP
    }
  })
  return databaseSession
}

export default {
  getShop
}

import prisma from "~/db.server"

export const getDatabaseSession = async () => {
  const databaseSession = await prisma.session.findFirst({
    where: {
      shop: process.env.SHOP
    }
  })
  return databaseSession
}

export default {
  getDatabaseSession
}

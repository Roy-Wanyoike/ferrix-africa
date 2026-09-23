import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // BE-14/SEC-05: query logging is opt-in (PRISMA_DEBUG=1) so SQL + PII
    // never leak into production logs by default.
    log: process.env.PRISMA_DEBUG === "1" ? ["query"] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
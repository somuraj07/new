import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const readAdapter = new PrismaPg({
  connectionString: process.env.DATABASE_READ_URL!, // REPLICA
  ssl: { rejectUnauthorized: false },
});

const prismaRead = new PrismaClient({
  adapter: readAdapter,
});

export default prismaRead;

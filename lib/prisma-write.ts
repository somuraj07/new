import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const writeAdapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!, // PRIMARY
  ssl: { rejectUnauthorized: false },
});

const prismaWrite = new PrismaClient({
  adapter: writeAdapter,
});

export default prismaWrite;

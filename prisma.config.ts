// Prisma 7 config
// The `datasource.url` here is used by Prisma CLI (migrations, db pull, etc.)
// The runtime PrismaClient uses the adapter in lib/db/client.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

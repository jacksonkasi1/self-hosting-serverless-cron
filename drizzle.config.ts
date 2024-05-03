import type { Config } from "drizzle-kit";
import { env } from "@/config";

export default {
  schema: "./src/db/schema/schema.ts",
  driver: "turso",
  dbCredentials: {
    url: env.DATABASE_URL!,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  out: "./drizzle",
} satisfies Config;

import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "@/config";
import * as schema from "./schema/schema";

// Database configuration and initialization
const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema, logger: false });

export default db;

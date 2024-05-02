import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "../../", `.env`),
});

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DATABASE_AUTH_TOKEN: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
  },
});

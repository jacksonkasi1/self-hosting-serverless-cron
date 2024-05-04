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

    AWS_REG: z.string().min(1),
    AWS_ACC_KEY_ID: z.string().min(1),
    AWS_SEC_ACCESS_KEY: z.string().min(1),

    WORKER_LAMBDA_ARN: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,

    AWS_REG: process.env.AWS_REG,
    AWS_ACC_KEY_ID: process.env.AWS_ACC_KEY_ID,
    AWS_SEC_ACCESS_KEY: process.env.AWS_SEC_ACCESS_KEY,

    WORKER_LAMBDA_ARN: process.env.WORKER_LAMBDA_ARN,
  },
});

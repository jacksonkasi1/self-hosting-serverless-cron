import AWS from "aws-sdk";

// ** import env
import { env } from "@/config";

// Set global AWS configuration
AWS.config.update({
  accessKeyId: env.AWS_ACC_KEY_ID,
  secretAccessKey: env.AWS_SEC_ACCESS_KEY,
  region: env.AWS_REG
});

// Export AWS services (Add more services as needed)
export const EventBridge = new AWS.EventBridge();
export const Lambda = new AWS.Lambda();

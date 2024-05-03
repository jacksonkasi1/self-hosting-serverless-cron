import AWS from "aws-sdk";

// ** import env
import { env } from "@/config";

// Set global AWS configuration
AWS.config.update({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION
});

// Export AWS services (Add more services as needed)
export const EventBridge = new AWS.EventBridge();
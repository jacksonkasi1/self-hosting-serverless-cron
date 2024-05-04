import { APIGatewayProxyHandler } from "aws-lambda";

import axios from "axios";

interface WebhookPayload {
  url: string;
  body: string;
  headers?: Record<string, string>;
}

export const executeWebhook = async (event: any) => {

  console.log(event);

  console.log("============");

  // Parse the incoming JSON payload
  const { url, body, headers } = JSON.parse(event || "{}",
  ) as WebhookPayload;

  console.log({url, body, headers});

  try {
    // Perform the POST request to the specified URL
    const response = await axios.post(url, body, { headers });

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Webhook executed successfully",
        data: response.data,
      }),
    };
  } catch (error: any) {
    console.error(`Error executing webhook: ${error}`);
    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to execute webhook",
        error: error.message,
      }),
    };
  }
};

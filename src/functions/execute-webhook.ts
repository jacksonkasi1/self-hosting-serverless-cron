import axios from "axios";

interface WebhookPayload {
  url: string;
  body: string;
  headers: Record<string, string>;
}

export const executeWebhook = async ({
  url,
  body,
  headers,
}: WebhookPayload): Promise<void> => {
  try {
    await axios.post(url, body, { headers });
  } catch (error) {
    console.error(`Error executing webhook: ${error}`);
  }
};

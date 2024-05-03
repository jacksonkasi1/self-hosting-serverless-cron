import axios from 'axios';

interface WebhookPayload {
  url: string;
  body: string;
  headers: Record<string, string>;
}

export const executeWebhook = async ({ url, body, headers }: WebhookPayload): Promise<void> => {
  await axios.post(url, body, { headers });
};

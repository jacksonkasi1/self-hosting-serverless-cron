import axios from "axios";

interface WebhookPayload {
  url: string;
  body: string;
  headers?: Record<string, string>;
}

export const executeWebhook = async ({
  url,
  body,
  headers,
}: WebhookPayload): Promise<void> => {
  try {
    const res = await axios.post(url, body, { headers });
    console.log(`Webhook executed successfully: ${res.data}`)
  } catch (error) {
    console.error(`Error executing webhook: ${error}`);
  }
};


export const sanitizeInput = (input: string): string => {
  // This regex matches any character that is NOT a letter, number, dot, hyphen, or underscore
  // and replaces them with an empty string.
  const validChars = input.replace(/[^.\-_A-Za-z0-9]/g, "_");
  return validChars.substr(0, 64); // Truncate to 64 characters
};

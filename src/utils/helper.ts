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

/**
 * Tries to parse a JSON string. Returns the parsed object if successful.
 * If parsing fails, returns the original input string.
 * @param input The JSON string to parse.
 * @returns The parsed JSON object or the original input string if parsing fails.
 */
export const safeJsonParse = (input: string): any => {
  try {
    return JSON.parse(input);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return input;
  }
}
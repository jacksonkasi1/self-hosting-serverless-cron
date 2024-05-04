export const sanitizeInput = (input: string): string => {
  // This regex matches any character that is NOT a letter, number, dot, hyphen, or underscore
  // and replaces them with an empty string.
  return input.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
};

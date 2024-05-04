export const sanitizeInput = (input: string): string => {
  // This regex matches any character that is NOT a letter, number, dot, hyphen, or underscore
  // and replaces them with an empty string.
  const validChars = input.replace(/[^.\-_A-Za-z0-9]/g, "_");
  return validChars.substr(0, 64); // Truncate to 64 characters

};

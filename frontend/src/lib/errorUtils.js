/**
 * Safely extract error message from various error types
 * @param {*} error - The error to format
 * @returns {string} A human-readable error message
 */
export function getErrorMessage(error) {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's null or undefined
  if (!error) {
    return 'An unknown error occurred';
  }

  // Try to extract message from various error formats
  if (error.message) {
    return error.message;
  }

  // Wagmi/viem specific error handling
  if (error.reason) {
    return error.reason;
  }

  if (error.shortMessage) {
    return error.shortMessage;
  }

  // If error has a details property
  if (error.details) {
    return error.details;
  }

  // Try to stringify the error
  try {
    const stringified = JSON.stringify(error);
    if (stringified !== '{}') {
      return stringified;
    }
  } catch (e) {
    // JSON.stringify failed
  }

  // Last resort
  return 'An unknown error occurred';
}

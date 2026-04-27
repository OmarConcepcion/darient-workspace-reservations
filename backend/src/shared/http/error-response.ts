import type { ErrorDetails } from "../errors/app-error.js";

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details: ErrorDetails;
  };
};

export const createErrorResponse = (
  code: string,
  message: string,
  details: ErrorDetails = {}
): ErrorResponse => ({
  error: {
    code,
    message,
    details
  }
});

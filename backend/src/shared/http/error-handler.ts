import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../errors/app-error.js";
import { createErrorResponse } from "./error-response.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next
) => {
  if (error instanceof AppError) {
    response
      .status(error.statusCode)
      .json(createErrorResponse(error.code, error.message, error.details));
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json(
      createErrorResponse("VALIDATION_ERROR", "Invalid request payload.", {
        issues: error.issues
      })
    );
    return;
  }

  response
    .status(500)
    .json(createErrorResponse("INTERNAL_SERVER_ERROR", "Unexpected error."));
};

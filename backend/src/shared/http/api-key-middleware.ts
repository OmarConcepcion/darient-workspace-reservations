import type { NextFunction, Request, Response } from "express";

import { getEnv } from "../../config/env.js";
import { createErrorResponse } from "./error-response.js";

export const apiKeyMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  const apiKey = request.header("x-api-key");

  if (apiKey !== getEnv().API_KEY) {
    response.status(401).json(
      createErrorResponse("UNAUTHORIZED", "Missing or invalid API key.")
    );
    return;
  }

  next();
};

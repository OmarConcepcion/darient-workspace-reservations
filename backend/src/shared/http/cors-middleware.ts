import type { NextFunction, Request, Response } from "express";

import { getEnv } from "../../config/env.js";

export const corsMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  response.header("Access-Control-Allow-Origin", getEnv().CORS_ORIGIN);
  response.header("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  response.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );

  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
};

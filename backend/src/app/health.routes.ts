import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "darient_backend",
    timestamp: new Date().toISOString()
  });
});

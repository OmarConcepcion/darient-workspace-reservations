import { Router } from "express";

export const healthRouter = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check API health
 *     description: Public readiness endpoint used to confirm the service is up.
 *     security: []
 *     responses:
 *       "200":
 *         description: Service is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/HealthResponse"
 *       "500":
 *         $ref: "#/components/responses/InternalServerError"
 */
healthRouter.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "darient_backend",
    timestamp: new Date().toISOString()
  });
});

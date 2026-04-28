import express from "express";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";

import { apiKeyMiddleware } from "../shared/http/api-key-middleware.js";
import { corsMiddleware } from "../shared/http/cors-middleware.js";
import { errorHandler } from "../shared/http/error-handler.js";
import { notFoundHandler } from "../shared/http/not-found-handler.js";
import { logger } from "../shared/logger/logger.js";
import { openApiSpec } from "../shared/openapi/openapi.js";
import { createIotAdminRouter } from "../modules/iot/presentation/iot-routes.js";
import { createPlaceRouter } from "../modules/places/presentation/place-routes.js";
import { createReservationRouter } from "../modules/reservations/presentation/reservation-routes.js";
import { createSpaceRouter } from "../modules/spaces/presentation/space-routes.js";
import {
  createDefaultDependencies,
  type AppDependencies
} from "./dependencies.js";
import { healthRouter } from "./health.routes.js";

export const createApp = (
  dependencyOverrides: Partial<AppDependencies> = {}
): express.Express => {
  const dependencies = {
    ...createDefaultDependencies(),
    ...dependencyOverrides
  };
  const app = express();

  app.disable("x-powered-by");
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  const apiRouter = express.Router();

  apiRouter.use(healthRouter);
  apiRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  apiRouter.use(apiKeyMiddleware);
  apiRouter.use("/places", createPlaceRouter(dependencies.placeRepository));
  apiRouter.use(
    "/spaces",
    createSpaceRouter(
      dependencies.spaceRepository,
      dependencies.placeRepository,
      dependencies.reservationRepository
    )
  );
  apiRouter.use(
    "/reservations",
    createReservationRouter(
      dependencies.reservationRepository,
      dependencies.spaceRepository,
      dependencies.placeRepository
    )
  );
  apiRouter.use(
    "/admin",
    createIotAdminRouter(
      dependencies.iotRepository,
      dependencies.mqttPublisher,
      dependencies.ssePublisher,
      dependencies.nowProvider
    )
  );
  apiRouter.use(notFoundHandler);

  app.use("/api/v1", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

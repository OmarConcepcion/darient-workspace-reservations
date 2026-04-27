import { createDefaultDependencies } from "./app/dependencies.js";
import { MqttRuntime } from "./modules/iot/infrastructure/mqtt-runtime.js";
import { createIotServiceForRuntime } from "./modules/iot/presentation/iot-routes.js";
import { createApp } from "./app/app.js";
import { getEnv } from "./config/env.js";
import { logger } from "./shared/logger/logger.js";
import { prisma } from "./shared/prisma/prisma.js";

const env = getEnv();
const dependencies = createDefaultDependencies();
const app = createApp(dependencies);
const mqttRuntime = new MqttRuntime(
  dependencies.mqttClient,
  createIotServiceForRuntime(
    dependencies.iotRepository,
    dependencies.mqttPublisher,
    dependencies.ssePublisher,
    dependencies.nowProvider
  )
);
let server: ReturnType<typeof app.listen> | null = null;

const closeHttpServer = async () =>
  new Promise<void>((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }

    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const shutdown = async (signal: NodeJS.Signals) => {
  logger.info({ signal }, "shutting down backend");

  try {
    await closeHttpServer();
    await mqttRuntime.stop();
    await prisma.$disconnect();
    logger.info("backend shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "shutdown failed" },
      "backend shutdown failed"
    );
    process.exit(1);
  }
};

try {
  await mqttRuntime.start();
  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "darient backend listening");
  });
} catch (error) {
  logger.fatal(
    { error: error instanceof Error ? error.message : "mqtt startup failed" },
    "failed to start mqtt runtime"
  );
  await prisma.$disconnect();
  process.exit(1);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

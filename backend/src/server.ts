import { createDefaultDependencies } from "./app/dependencies.js";
import { MqttRuntime } from "./modules/iot/infrastructure/mqtt-runtime.js";
import { createIotServiceForRuntime } from "./modules/iot/presentation/iot-routes.js";
import { createApp } from "./app/app.js";
import { getEnv } from "./config/env.js";
import { logger } from "./shared/logger/logger.js";

const env = getEnv();
const dependencies = createDefaultDependencies();
const app = createApp(dependencies);
const mqttRuntime = new MqttRuntime(
  createIotServiceForRuntime(
    dependencies.iotRepository,
    dependencies.mqttPublisher,
    dependencies.ssePublisher,
    dependencies.nowProvider
  )
);

mqttRuntime.start();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "darient backend listening");
});

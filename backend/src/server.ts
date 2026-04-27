import { createApp } from "./app/app.js";
import { getEnv } from "./config/env.js";
import { logger } from "./shared/logger/logger.js";

const env = getEnv();
const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "darient backend listening");
});

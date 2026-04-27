import { AppError } from "../../../shared/errors/app-error.js";

export const parseIotTopic = (topic: string) => {
  const match = /^sites\/([^/]+)\/offices\/([^/]+)\/(telemetry|reported|desired)$/.exec(
    topic
  );

  if (!match) {
    throw new AppError(400, "INVALID_IOT_TOPIC", "Invalid IoT topic.");
  }

  return {
    siteId: match[1],
    officeId: match[2],
    messageType: match[3] as "telemetry" | "reported" | "desired"
  };
};

import "dotenv/config";
import mqtt from "mqtt";

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";

// naive arg parse: node sendDesired.js --site-id SITE_A --office-id OFFICE_1 --interval 5 --co2 900
const args = process.argv.slice(2);
const getArg = (k, def) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : def;
};

const SITE_ID = getArg("site-id");
const OFFICE_ID = getArg("office-id");
const samplingIntervalSec = Number(getArg("interval", 10));
const co2_alert_threshold = Number(getArg("co2", 1000));

if (!SITE_ID || !OFFICE_ID) {
  console.error(
    "SITE_ID and OFFICE_ID are required as command line arguments:"
  );
  console.error(
    "Usage: node send-desired.js --site-id <site_id> --office-id <office_id> [--interval <seconds>] [--co2 <threshold>]"
  );
  process.exit(1);
}

const desired = { samplingIntervalSec, co2_alert_threshold };
const topic = `sites/${SITE_ID}/offices/${OFFICE_ID}/desired`;
const client = mqtt.connect(MQTT_URL);

client.on("connect", () => {
  client.publish(topic, JSON.stringify(desired), { qos: 0 }, (err) => {
    if (err) console.error("publish error", err);
    else console.log("published desired →", topic, desired);
    setTimeout(() => client.end(), 200);
  });
});

client.on("error", (err) => {
  console.error("connection error", err);
  client.end();
});

client.on("close", () => {
  console.log("disconnected");
});

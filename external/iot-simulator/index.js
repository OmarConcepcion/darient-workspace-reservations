import "dotenv/config";
import mqtt from "mqtt";

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";

// Parse command line arguments
const args = process.argv.slice(2);
let SITE_ID = null;
let OFFICE_ID = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--site-id" && args[i + 1]) {
    SITE_ID = args[i + 1];
    i++; // Skip next arg since we consumed it
  } else if (args[i] === "--office-id" && args[i + 1]) {
    OFFICE_ID = args[i + 1];
    i++; // Skip next arg since we consumed it
  }
}

let INTERVAL_SEC = Number(process.env.INTERVAL_SEC || 10);
let CO2_ALERT_THRESHOLD = 1000; // default value
let currentTimeout = null;
const BASE = {
  temp_c: Number(process.env.BASE_TEMP_C || 23),
  humidity_pct: Number(process.env.BASE_HUMIDITY_PCT || 48),
  co2_ppm: Number(process.env.BASE_CO2_PPM || 800),
  occupancy: Number(process.env.BASE_OCCUPANCY || 3),
  power_w: Number(process.env.BASE_POWER_W || 120),
};

if (!SITE_ID || !OFFICE_ID) {
  console.error(
    "SITE_ID and OFFICE_ID are required as command line arguments:"
  );
  console.error(
    "Usage: node index.js --site-id <site_id> --office-id <office_id>"
  );
  process.exit(1);
}

console.log(`starting simulator for site=${SITE_ID} office=${OFFICE_ID}`);
const client = mqtt.connect(MQTT_URL);
client.on("connect", () => {
  console.log("[sim]connected to", MQTT_URL);

  const desiredTopic = `sites/${SITE_ID}/offices/${OFFICE_ID}/desired`;
  const reportedTopic = `sites/${SITE_ID}/offices/${OFFICE_ID}/reported`;
  const telemetryTopic = `sites/${SITE_ID}/offices/${OFFICE_ID}/telemetry`;

  // Listen for desired config
  client.subscribe(desiredTopic, (err) => {
    if (err) console.error("[sim] subscribe error", err);
  });

  client.on("message", (topic, payload) => {
    if (topic !== desiredTopic) return;
    try {
      const desired = JSON.parse(payload.toString());
      if (typeof desired.samplingIntervalSec === "number") {
        const oldInterval = INTERVAL_SEC;
        INTERVAL_SEC = desired.samplingIntervalSec;
        console.log(
          `[sim] applied desired samplingIntervalSec=${INTERVAL_SEC}s (was ${oldInterval}s)`
        );

        // Reschedule telemetry loop with new interval
        if (currentTimeout) {
          clearTimeout(currentTimeout);
          currentTimeout = null;
        }

        schedule();
      }

      if (
        typeof desired.co2_alert_threshold === "number" &&
        desired.co2_alert_threshold > 0
      ) {
        const oldThreshold = CO2_ALERT_THRESHOLD;
        CO2_ALERT_THRESHOLD = desired.co2_alert_threshold;
        console.log(
          `[sim] applied desired co2_alert_threshold=${CO2_ALERT_THRESHOLD}ppm (was ${oldThreshold}ppm)`
        );
      }
      // echo reported after a short delay
      setTimeout(() => {
        const reported = {
          ts: new Date().toISOString(),
          samplingIntervalSec: INTERVAL_SEC,
          co2_alert_threshold: CO2_ALERT_THRESHOLD,
          firmwareVersion: "1.0.0",
        };
        client.publish(reportedTopic, JSON.stringify(reported), { qos: 0 });
        console.log("[sim] reported state", reported);
      }, 500);
    } catch (e) {
      console.error("[sim] bad desired JSON", e.message);
    }
  });

  // Telemetry loop
  const publishTelemetry = () => {
    const reading = synthReading(BASE);
    const msg = {
      ts: new Date().toISOString(),
      temp_c: reading.temp_c,
      humidity_pct: reading.humidity_pct,
      co2_ppm: reading.co2_ppm,
      occupancy: reading.occupancy,
      power_w: reading.power_w,
    };

    client.publish(telemetryTopic, JSON.stringify(msg), { qos: 0 });
    console.log("[sim] telemetry", msg);
    schedule();
  };

  const schedule = () => {
    currentTimeout = setTimeout(publishTelemetry, INTERVAL_SEC * 1000);
  };

  schedule();
});

client.on("error", (err) => {
  console.error("[sim] mqtt error", err.message);
});

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function jitter(base, spread) {
  return base + (Math.random() * 2 - 1) * spread;
}

function synthReading(base) {
  return {
    temp_c: Number(jitter(base.temp_c, 0.4).toFixed(2)),
    humidity_pct: Number(
      clamp(jitter(base.humidity_pct, 1.5), 35, 65).toFixed(2)
    ),
    co2_ppm: Math.round(clamp(jitter(base.co2_ppm, 80), 400, 2000)),
    occupancy: Math.max(
      0,
      Math.round(clamp(jitter(base.occupancy, 1.2), 0, 12))
    ),
    power_w: Math.max(0, Math.round(clamp(jitter(base.power_w, 15), 0, 1000))),
  };
}

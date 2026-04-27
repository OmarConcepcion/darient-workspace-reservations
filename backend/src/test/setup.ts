process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.API_KEY = "test-api-key";
process.env.DATABASE_URL =
  "postgresql://darient:darient@localhost:5432/darient_test?schema=core";
process.env.MQTT_URL = "mqtt://localhost:1883";
process.env.LOG_LEVEL = "silent";
process.env.CORS_ORIGIN = "http://localhost:5173";

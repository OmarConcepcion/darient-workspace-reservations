CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS "core";
CREATE SCHEMA IF NOT EXISTS "iot";
CREATE SCHEMA IF NOT EXISTS "audit";

CREATE TYPE "core"."reservation_status" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');
CREATE TYPE "iot"."alert_type" AS ENUM ('CO2', 'OCCUPANCY_MAX', 'OCCUPANCY_UNEXPECTED');
CREATE TYPE "iot"."alert_status" AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE "audit"."raw_telemetry_processing_status" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');
CREATE TYPE "iot"."device_desired_publish_status" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

CREATE TABLE "core"."places" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "iot_site_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/Panama',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "core"."spaces" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "place_id" UUID NOT NULL,
  "iot_office_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location_reference" TEXT,
  "capacity" INTEGER NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "core"."reservations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "place_id" UUID NOT NULL,
  "space_id" UUID NOT NULL,
  "customer_email" TEXT NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "status" "core"."reservation_status" NOT NULL DEFAULT 'ACTIVE',
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "core"."office_hours" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "space_id" UUID NOT NULL,
  "day_of_week" INTEGER NOT NULL,
  "opens_at" VARCHAR(5) NOT NULL,
  "closes_at" VARCHAR(5) NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "office_hours_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "iot"."telemetry_aggregations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "space_id" UUID NOT NULL,
  "window_start" TIMESTAMP(3) NOT NULL,
  "window_end" TIMESTAMP(3) NOT NULL,
  "avg_temp_c" DOUBLE PRECISION NOT NULL,
  "avg_humidity_pct" DOUBLE PRECISION NOT NULL,
  "avg_co2_ppm" DOUBLE PRECISION NOT NULL,
  "max_co2_ppm" INTEGER NOT NULL,
  "avg_occupancy" DOUBLE PRECISION NOT NULL,
  "max_occupancy" INTEGER NOT NULL,
  "latest_power_w" INTEGER NOT NULL,
  "sample_count" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "telemetry_aggregations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "iot"."device_desired" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "space_id" UUID NOT NULL,
  "sampling_interval_sec" INTEGER NOT NULL DEFAULT 10,
  "co2_alert_threshold" INTEGER NOT NULL DEFAULT 1000,
  "publish_status" "iot"."device_desired_publish_status" NOT NULL DEFAULT 'PENDING',
  "last_published_at" TIMESTAMP(3),
  "publish_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "device_desired_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "iot"."device_reported" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "space_id" UUID NOT NULL,
  "sampling_interval_sec" INTEGER NOT NULL,
  "co2_alert_threshold" INTEGER NOT NULL,
  "firmware_version" TEXT NOT NULL,
  "reported_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "device_reported_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "iot"."alerts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "space_id" UUID NOT NULL,
  "type" "iot"."alert_type" NOT NULL,
  "status" "iot"."alert_status" NOT NULL DEFAULT 'OPEN',
  "started_at" TIMESTAMP(3) NOT NULL,
  "resolved_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit"."raw_telemetry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "topic" TEXT NOT NULL,
  "site_id" TEXT NOT NULL,
  "office_id" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processing_status" "audit"."raw_telemetry_processing_status" NOT NULL DEFAULT 'RECEIVED',
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),
  "error_message" TEXT,

  CONSTRAINT "raw_telemetry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "places_iot_site_id_key" ON "core"."places"("iot_site_id");
CREATE UNIQUE INDEX "spaces_place_id_iot_office_id_key" ON "core"."spaces"("place_id", "iot_office_id");
CREATE INDEX "spaces_place_id_idx" ON "core"."spaces"("place_id");
CREATE INDEX "reservations_space_status_time_idx" ON "core"."reservations"("space_id", "status", "starts_at", "ends_at");
CREATE INDEX "reservations_customer_status_week_idx" ON "core"."reservations"("customer_email", "status", "starts_at");
CREATE UNIQUE INDEX "office_hours_space_id_day_of_week_key" ON "core"."office_hours"("space_id", "day_of_week");
CREATE INDEX "telemetry_aggregations_space_window_idx" ON "iot"."telemetry_aggregations"("space_id", "window_start");
CREATE UNIQUE INDEX "device_desired_space_id_key" ON "iot"."device_desired"("space_id");
CREATE UNIQUE INDEX "device_reported_space_id_key" ON "iot"."device_reported"("space_id");
CREATE INDEX "alerts_space_status_type_idx" ON "iot"."alerts"("space_id", "status", "type");
CREATE INDEX "raw_telemetry_site_office_received_idx" ON "audit"."raw_telemetry"("site_id", "office_id", "received_at");

ALTER TABLE "core"."spaces"
  ADD CONSTRAINT "spaces_place_id_fkey"
  FOREIGN KEY ("place_id") REFERENCES "core"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "core"."reservations"
  ADD CONSTRAINT "reservations_place_id_fkey"
  FOREIGN KEY ("place_id") REFERENCES "core"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "core"."reservations"
  ADD CONSTRAINT "reservations_space_id_fkey"
  FOREIGN KEY ("space_id") REFERENCES "core"."spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "core"."office_hours"
  ADD CONSTRAINT "office_hours_space_id_fkey"
  FOREIGN KEY ("space_id") REFERENCES "core"."spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "iot"."telemetry_aggregations"
  ADD CONSTRAINT "telemetry_aggregations_space_id_fkey"
  FOREIGN KEY ("space_id") REFERENCES "core"."spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "iot"."device_desired"
  ADD CONSTRAINT "device_desired_space_id_fkey"
  FOREIGN KEY ("space_id") REFERENCES "core"."spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "iot"."device_reported"
  ADD CONSTRAINT "device_reported_space_id_fkey"
  FOREIGN KEY ("space_id") REFERENCES "core"."spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "iot"."alerts"
  ADD CONSTRAINT "alerts_space_id_fkey"
  FOREIGN KEY ("space_id") REFERENCES "core"."spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

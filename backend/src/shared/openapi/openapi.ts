import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import swaggerJSDoc from "swagger-jsdoc";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);
const projectRoot = resolve(currentDir, "../../..");

const isoTimestamp = {
  type: "string",
  format: "date-time",
  example: "2026-04-27T15:00:00.000Z"
} as const;

const uuid = {
  type: "string",
  format: "uuid",
  example: "11111111-1111-4111-8111-111111111111"
} as const;

const errorResponseSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message", "details"],
      properties: {
        code: {
          type: "string",
          example: "VALIDATION_ERROR"
        },
        message: {
          type: "string",
          example: "Invalid request payload."
        },
        details: {
          type: "object",
          additionalProperties: true,
          example: {}
        }
      }
    }
  }
} as const;

const createErrorResponse = (
  code: string,
  message: string,
  details: Record<string, unknown> = {}
) => ({
  description: message,
  content: {
    "application/json": {
      schema: {
        $ref: "#/components/schemas/ErrorResponse"
      },
      example: {
        error: {
          code,
          message,
          details
        }
      }
    }
  }
});

export const openApiSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Darient Workspace Reservations API",
      version: "0.1.0",
      description:
        "REST API for workspace reservations and IoT monitoring, exposed under /api/v1."
    },
    servers: [
      {
        url: "/api/v1",
        description: "Current API version"
      }
    ],
    tags: [
      { name: "Health", description: "Service readiness and infrastructure checks" },
      { name: "Places", description: "Workspace site management" },
      { name: "Spaces", description: "Bookable space management and availability" },
      { name: "Reservations", description: "Reservation lifecycle operations" },
      { name: "Admin IoT", description: "Monitoring, alerts and IoT device control" }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key"
        }
      },
      schemas: {
        ErrorResponse: errorResponseSchema,
        HealthResponse: {
          type: "object",
          required: ["status", "service", "timestamp"],
          properties: {
            status: {
              type: "string",
              example: "ok"
            },
            service: {
              type: "string",
              example: "darient_backend"
            },
            timestamp: isoTimestamp
          }
        },
        Place: {
          type: "object",
          required: [
            "id",
            "iot_site_id",
            "name",
            "latitude",
            "longitude",
            "timezone",
            "created_at",
            "updated_at"
          ],
          properties: {
            id: uuid,
            iot_site_id: {
              type: "string",
              example: "SITE_A"
            },
            name: {
              type: "string",
              example: "Headquarters"
            },
            latitude: {
              type: "number",
              example: 8.95
            },
            longitude: {
              type: "number",
              example: -79.55
            },
            timezone: {
              type: "string",
              example: "America/Panama"
            },
            created_at: isoTimestamp,
            updated_at: isoTimestamp
          }
        },
        PlaceListResponse: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Place"
              }
            }
          }
        },
        CreatePlaceRequest: {
          type: "object",
          required: ["iot_site_id", "name", "latitude", "longitude"],
          properties: {
            iot_site_id: {
              type: "string",
              minLength: 1,
              example: "SITE_A"
            },
            name: {
              type: "string",
              minLength: 1,
              example: "Headquarters"
            },
            latitude: {
              type: "number",
              example: 8.95
            },
            longitude: {
              type: "number",
              example: -79.55
            },
            timezone: {
              type: "string",
              minLength: 1,
              default: "America/Panama",
              example: "America/Panama"
            }
          }
        },
        UpdatePlaceRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            iot_site_id: {
              type: "string",
              minLength: 1,
              example: "SITE_B"
            },
            name: {
              type: "string",
              minLength: 1,
              example: "Branch Office"
            },
            latitude: {
              type: "number",
              example: 8.96
            },
            longitude: {
              type: "number",
              example: -79.56
            },
            timezone: {
              type: "string",
              minLength: 1,
              example: "America/Panama"
            }
          }
        },
        Space: {
          type: "object",
          required: [
            "id",
            "place_id",
            "iot_office_id",
            "name",
            "location_reference",
            "capacity",
            "description",
            "created_at",
            "updated_at"
          ],
          properties: {
            id: uuid,
            place_id: uuid,
            iot_office_id: {
              type: "string",
              example: "OFFICE_1"
            },
            name: {
              type: "string",
              example: "Focus Room"
            },
            location_reference: {
              type: "string",
              nullable: true,
              example: "Level 2"
            },
            capacity: {
              type: "integer",
              minimum: 1,
              example: 4
            },
            description: {
              type: "string",
              nullable: true,
              example: "Quiet room with whiteboard."
            },
            created_at: isoTimestamp,
            updated_at: isoTimestamp
          }
        },
        SpaceListResponse: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Space"
              }
            }
          }
        },
        CreateSpaceRequest: {
          type: "object",
          required: ["place_id", "iot_office_id", "name", "capacity"],
          properties: {
            place_id: uuid,
            iot_office_id: {
              type: "string",
              minLength: 1,
              example: "OFFICE_1"
            },
            name: {
              type: "string",
              minLength: 1,
              example: "Focus Room"
            },
            location_reference: {
              type: "string",
              nullable: true,
              example: "Level 2"
            },
            capacity: {
              type: "integer",
              minimum: 1,
              example: 4
            },
            description: {
              type: "string",
              nullable: true,
              example: "Quiet room with whiteboard."
            }
          }
        },
        UpdateSpaceRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            place_id: uuid,
            iot_office_id: {
              type: "string",
              minLength: 1,
              example: "OFFICE_2"
            },
            name: {
              type: "string",
              minLength: 1,
              example: "Collaboration Room"
            },
            location_reference: {
              type: "string",
              nullable: true,
              example: "Level 3"
            },
            capacity: {
              type: "integer",
              minimum: 1,
              example: 6
            },
            description: {
              type: "string",
              nullable: true,
              example: "Hybrid collaboration room."
            }
          }
        },
        Reservation: {
          type: "object",
          required: [
            "id",
            "place_id",
            "space_id",
            "customer_email",
            "starts_at",
            "ends_at",
            "status",
            "cancelled_at",
            "created_at",
            "updated_at"
          ],
          properties: {
            id: uuid,
            place_id: uuid,
            space_id: uuid,
            customer_email: {
              type: "string",
              format: "email",
              example: "client@example.com"
            },
            starts_at: isoTimestamp,
            ends_at: isoTimestamp,
            status: {
              type: "string",
              enum: ["ACTIVE", "CANCELLED", "EXPIRED"],
              example: "ACTIVE"
            },
            cancelled_at: {
              ...isoTimestamp,
              nullable: true
            },
            created_at: isoTimestamp,
            updated_at: isoTimestamp
          }
        },
        ReservationPagination: {
          type: "object",
          required: ["page", "page_size", "total"],
          properties: {
            page: {
              type: "integer",
              minimum: 1,
              example: 1
            },
            page_size: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              example: 10
            },
            total: {
              type: "integer",
              minimum: 0,
              example: 24
            }
          }
        },
        ReservationListResponse: {
          type: "object",
          required: ["data", "pagination"],
          properties: {
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Reservation"
              }
            },
            pagination: {
              $ref: "#/components/schemas/ReservationPagination"
            }
          }
        },
        CreateReservationRequest: {
          type: "object",
          required: [
            "place_id",
            "space_id",
            "customer_email",
            "starts_at",
            "ends_at"
          ],
          properties: {
            place_id: uuid,
            space_id: uuid,
            customer_email: {
              type: "string",
              format: "email",
              example: "client@example.com"
            },
            starts_at: isoTimestamp,
            ends_at: isoTimestamp
          }
        },
        UpdateReservationRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            place_id: uuid,
            space_id: uuid,
            customer_email: {
              type: "string",
              format: "email",
              example: "client@example.com"
            },
            starts_at: isoTimestamp,
            ends_at: isoTimestamp
          }
        },
        AvailabilityOfficeHours: {
          type: "object",
          required: ["opens_at", "closes_at", "is_enabled"],
          properties: {
            opens_at: {
              type: "string",
              nullable: true,
              example: "08:00"
            },
            closes_at: {
              type: "string",
              nullable: true,
              example: "18:00"
            },
            is_enabled: {
              type: "boolean",
              example: true
            }
          }
        },
        ReservedWindow: {
          type: "object",
          required: ["reservation_id", "starts_at", "ends_at"],
          properties: {
            reservation_id: uuid,
            starts_at: isoTimestamp,
            ends_at: isoTimestamp
          }
        },
        AvailabilityWindow: {
          type: "object",
          required: ["starts_at", "ends_at"],
          properties: {
            starts_at: isoTimestamp,
            ends_at: isoTimestamp
          }
        },
        AvailabilityResponse: {
          type: "object",
          required: [
            "space_id",
            "date",
            "timezone",
            "office_hours",
            "reserved_windows",
            "available_windows"
          ],
          properties: {
            space_id: uuid,
            date: {
              type: "string",
              pattern: "^\\d{4}-\\d{2}-\\d{2}$",
              example: "2026-04-27"
            },
            timezone: {
              type: "string",
              example: "America/Panama"
            },
            office_hours: {
              $ref: "#/components/schemas/AvailabilityOfficeHours"
            },
            reserved_windows: {
              type: "array",
              items: {
                $ref: "#/components/schemas/ReservedWindow"
              }
            },
            available_windows: {
              type: "array",
              items: {
                $ref: "#/components/schemas/AvailabilityWindow"
              }
            }
          }
        },
        MonitoringOfficeHour: {
          type: "object",
          required: ["day_of_week", "opens_at", "closes_at", "is_enabled"],
          properties: {
            day_of_week: {
              type: "integer",
              minimum: 0,
              maximum: 6,
              example: 1
            },
            opens_at: {
              type: "string",
              example: "08:00"
            },
            closes_at: {
              type: "string",
              example: "18:00"
            },
            is_enabled: {
              type: "boolean",
              example: true
            }
          }
        },
        TelemetryAggregation: {
          type: "object",
          nullable: true,
          properties: {
            window_start: isoTimestamp,
            window_end: isoTimestamp,
            avg_temp_c: {
              type: "number",
              example: 24.1
            },
            avg_humidity_pct: {
              type: "number",
              example: 49.3
            },
            avg_co2_ppm: {
              type: "integer",
              example: 930
            },
            max_co2_ppm: {
              type: "integer",
              example: 950
            },
            avg_occupancy: {
              type: "number",
              example: 3.2
            },
            max_occupancy: {
              type: "integer",
              example: 4
            },
            latest_power_w: {
              type: "integer",
              example: 120
            },
            sample_count: {
              type: "integer",
              example: 4
            }
          }
        },
        DeviceDesired: {
          type: "object",
          nullable: true,
          properties: {
            sampling_interval_sec: {
              type: "integer",
              example: 10
            },
            co2_alert_threshold: {
              type: "integer",
              example: 1000
            },
            publish_status: {
              type: "string",
              enum: ["PENDING", "PUBLISHED", "FAILED"],
              example: "PUBLISHED"
            },
            last_published_at: {
              ...isoTimestamp,
              nullable: true
            },
            publish_error: {
              type: "string",
              nullable: true,
              example: null
            }
          }
        },
        DeviceReported: {
          type: "object",
          nullable: true,
          properties: {
            sampling_interval_sec: {
              type: "integer",
              example: 10
            },
            co2_alert_threshold: {
              type: "integer",
              example: 1000
            },
            firmware_version: {
              type: "string",
              example: "1.0.0"
            },
            reported_at: isoTimestamp
          }
        },
        Alert: {
          type: "object",
          required: [
            "alert_id",
            "space_id",
            "type",
            "status",
            "started_at",
            "resolved_at",
            "metadata"
          ],
          properties: {
            alert_id: uuid,
            space_id: uuid,
            type: {
              type: "string",
              enum: ["CO2", "OCCUPANCY_MAX", "OCCUPANCY_UNEXPECTED"],
              example: "CO2"
            },
            status: {
              type: "string",
              enum: ["OPEN", "RESOLVED"],
              example: "OPEN"
            },
            started_at: isoTimestamp,
            resolved_at: {
              ...isoTimestamp,
              nullable: true
            },
            metadata: {
              type: "object",
              additionalProperties: true,
              example: {
                latest_co2_ppm: 1100,
                threshold: 1000
              }
            }
          }
        },
        AlertListResponse: {
          type: "object",
          required: ["data"],
          properties: {
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Alert"
              }
            }
          }
        },
        UpdateDeviceDesiredRequest: {
          type: "object",
          required: ["sampling_interval_sec", "co2_alert_threshold"],
          properties: {
            sampling_interval_sec: {
              type: "integer",
              minimum: 1,
              example: 5
            },
            co2_alert_threshold: {
              type: "integer",
              minimum: 1,
              example: 900
            }
          }
        },
        MonitoringResponse: {
          type: "object",
          required: [
            "space_id",
            "iot_site_id",
            "iot_office_id",
            "capacity",
            "timezone",
            "office_hours",
            "latest_telemetry",
            "device_desired",
            "device_reported",
            "active_alerts"
          ],
          properties: {
            space_id: uuid,
            iot_site_id: {
              type: "string",
              example: "SITE_A"
            },
            iot_office_id: {
              type: "string",
              example: "OFFICE_1"
            },
            capacity: {
              type: "integer",
              minimum: 1,
              example: 4
            },
            timezone: {
              type: "string",
              example: "America/Panama"
            },
            office_hours: {
              type: "array",
              items: {
                $ref: "#/components/schemas/MonitoringOfficeHour"
              }
            },
            latest_telemetry: {
              $ref: "#/components/schemas/TelemetryAggregation"
            },
            device_desired: {
              $ref: "#/components/schemas/DeviceDesired"
            },
            device_reported: {
              $ref: "#/components/schemas/DeviceReported"
            },
            active_alerts: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Alert"
              }
            }
          }
        }
      },
      responses: {
        ValidationError: createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid request payload.",
          {
            issues: [
              {
                path: ["page"],
                message: "Expected number, received string."
              }
            ]
          }
        ),
        UnauthorizedError: createErrorResponse(
          "UNAUTHORIZED",
          "Missing or invalid API key."
        ),
        NotFoundError: createErrorResponse("NOT_FOUND", "Resource not found."),
        InternalServerError: createErrorResponse(
          "INTERNAL_SERVER_ERROR",
          "Unexpected error."
        ),
        ReservationConflictError: createErrorResponse(
          "RESERVATION_CONFLICT",
          "The selected space is already reserved for that time range.",
          {
            available_windows: [
              {
                starts_at: "2026-04-28T13:00:00.000Z",
                ends_at: "2026-04-28T14:00:00.000Z"
              },
              {
                starts_at: "2026-04-28T15:00:00.000Z",
                ends_at: "2026-04-28T23:00:00.000Z"
              }
            ]
          }
        ),
        WeeklyReservationLimitError: createErrorResponse(
          "WEEKLY_RESERVATION_LIMIT_EXCEEDED",
          "A customer can have at most 3 active reservations per week."
        ),
        ReservationDeleteConflictError: createErrorResponse(
          "RESERVATION_MUST_BE_CANCELLED_BEFORE_DELETE",
          "Reservation must be cancelled before it can be deleted."
        ),
        MqttPublishFailedError: createErrorResponse(
          "MQTT_PUBLISH_FAILED",
          "Failed to publish desired device state.",
          {
            topic: "sites/SITE_A/offices/OFFICE_1/desired",
            space_id: "11111111-1111-4111-8111-111111111111"
          }
        )
      }
    },
    security: [{ ApiKeyAuth: [] }]
  },
  apis: [
    resolve(projectRoot, "src/**/*.ts"),
    resolve(projectRoot, "dist/**/*.js")
  ]
});

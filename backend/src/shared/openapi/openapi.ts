import swaggerJSDoc from "swagger-jsdoc";

export const openApiSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Darient Workspace Reservations API",
      version: "0.1.0"
    },
    servers: [
      {
        url: "/api/v1"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key"
        }
      }
    },
    security: [{ ApiKeyAuth: [] }]
  },
  apis: ["src/**/*.ts"]
});

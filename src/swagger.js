const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Student Manager API",
      version: "1.0.0",
      description: "API quản lý sinh viên và học tập",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    "./src/routes/*.js",
    "./src/controllers/*.js",
    "./src/swagger-endpoints.js",
  ],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };

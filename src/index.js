const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
require("dotenv").config();
const { PORT } = require("./configs");
const { sequelize, connectPostgreSQL } = require("./services/sequelize");
const { syncModels } = require("./services/sequelizeSync");
const { swaggerUi, specs } = require("./swagger");
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Kết nối PostgreSQL
connectPostgreSQL();
syncModels();

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Student Manager API",
  })
);

app.use(require("./routes/index"));

app.listen(PORT, () => {
  console.log(`Máy chủ đang chạy trên cổng ${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`Prisma Studio: http://localhost:5555`);
  console.log(`Để mở Prisma Studio, chạy lệnh: npx prisma studio`);
  console.log(`Để generate models, chạy lệnh: npx prisma generate`);
});

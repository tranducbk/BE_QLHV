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

// Cấu hình CORS chi tiết để cho phép Frontend truy cập
const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép requests không có origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "https://qlhv.vercel.app",
      "https://fe-student-manager.vercel.app", // Thêm domain mới nếu có
      "http://localhost:3000",
      "http://localhost:3002",
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "token", "x-access-token"],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Trust proxy for production deployment (Render.com, Heroku, etc.)
app.set("trust proxy", 1);
console.log("🔧 Trust proxy enabled for production deployment");

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

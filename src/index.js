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
      "https://fe-student-manager.vercel.app",
      "https://fe-qlhv-ahnzq9nap-tran-ducs-projects-6b0bdbb3.vercel.app", // Domain mới của Vercel
      "http://localhost:3000",
      "http://localhost:4000",
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Cho phép gửi cookies
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "token",
    "x-access-token",
    "Cookie",
    "x-uploadthing-package",
    "x-uploadthing-version",
    "x-uploadthing-file-name",
    "x-uploadthing-file-size",
    "x-uploadthing-file-type",
    "traceparent",
    "b3",
  ],
  exposedHeaders: ["Set-Cookie"], // Cho phép frontend đọc Set-Cookie header
  preflightContinue: false, // Pass preflight response to next handler
  maxAge: 86400, // Cache preflight for 24 hours
};

// Apply CORS globally
app.use(cors(corsOptions));

// Explicitly handle all OPTIONS requests for preflight
app.options("*", cors(corsOptions));

// Add additional CORS headers middleware as backup
// Đặc biệt xử lý cho UploadThing routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://qlhv.vercel.app",
    "https://fe-student-manager.vercel.app",
    "https://fe-qlhv-ahnzq9nap-tran-ducs-projects-6b0bdbb3.vercel.app",
    "http://localhost:3000",
    "http://localhost:3002",
  ];

  if (allowedOrigins.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );

    // Cho UploadThing routes, cho phép tất cả headers cần thiết
    if (req.path?.startsWith("/api/uploadthing")) {
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, token, x-access-token, Cookie, x-uploadthing-package, x-uploadthing-version, x-uploadthing-file-name, x-uploadthing-file-size, x-uploadthing-file-type, traceparent, b3, x-uploadthing-*"
      );
    } else {
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, token, x-access-token, Cookie, x-uploadthing-package, x-uploadthing-version, x-uploadthing-file-name, x-uploadthing-file-size, x-uploadthing-file-type, traceparent, b3"
      );
    }
    res.header("Access-Control-Expose-Headers", "Set-Cookie");
  }

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

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

// UploadThing route handler
const { createRouteHandler } = require("uploadthing/express");
const { uploadRouter } = require("./uploadthing");

app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
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

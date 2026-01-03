require("dotenv").config();

const { createUploadthing } = require("uploadthing/express");
const { UploadThingError } = require("uploadthing/server");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_ACCESS_KEY } = require("./configs");

const f = createUploadthing();

/**
 * FileRouter cho ứng dụng
 * @see https://docs.uploadthing.com/file-routes
 */
const uploadRouter = {
  /**
   * FileRoute cho grade files (kết quả học tập)
   * Chấp nhận: PDF, JPG, PNG
   * Max size: 10MB
   */
  gradeFiles: f({
    pdf: {
      maxFileSize: "10MB",
      maxFileCount: 1,
    },
    image: {
      maxFileSize: "10MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        throw new UploadThingError("Unauthorized");
      }

      try {
        const token = authHeader.replace("Bearer ", "");
        const jwtKey =
          JWT_SECRET ||
          process.env.JWT_SECRET ||
          JWT_ACCESS_KEY ||
          process.env.JWT_ACCESS_KEY;

        if (!jwtKey) {
          throw new UploadThingError("Server configuration error");
        }

        const decoded = jwt.verify(token, jwtKey);

        return {
          userId: decoded.id,
          userRole: decoded.role,
          timestamp: Date.now(),
        };
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          throw new UploadThingError("Token đã hết hạn");
        }
        if (error instanceof UploadThingError) {
          throw error;
        }
        throw new UploadThingError("Invalid token");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        fileUrl: file.url,
        fileName: file.name,
        fileKey: file.key,
      };
    }),
};

module.exports = { uploadRouter };

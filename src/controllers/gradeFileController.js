const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { GradeProposal } = require("../models");

// Constants
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const CONTENT_TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

// Cấu hình multer để lưu file vào thư mục uploads/grade-files
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "grade-files");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Tạo tên file tạm thời, sẽ đổi tên sau khi có đầy đủ thông tin
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const tempFileName = `temp_${timestamp}_${Math.random()
      .toString(36)
      .substring(7)}${extension}`;
    cb(null, tempFileName);
  },
});

// Filter để chỉ chấp nhận các loại file được phép
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Loại file không được hỗ trợ. Chỉ chấp nhận: PDF, DOC, DOCX, JPG, PNG"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

// Middleware upload file
const uploadFileMiddleware = upload.single("file");

/**
 * Upload file đính kèm cho đề xuất kết quả học tập
 */
const uploadGradeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Không có file được tải lên",
      });
    }

    const { studentId, semester, schoolYear } = req.body;

    if (!studentId || !semester || !schoolYear) {
      // Xóa file đã upload nếu thiếu thông tin
      if (req.file.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({
        error: "Thiếu thông tin: studentId, semester, schoolYear",
      });
    }

    // Decode và sanitize tên file
    const originalName = decodeFileName(req.file.originalname);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const sanitizedBaseName = sanitizeFileName(baseName);
    const newFileName = await findUniqueFileName(sanitizedBaseName, extension);

    const newFilePath = path.join(path.dirname(req.file.path), newFileName);

    // Đổi tên file từ temp sang tên chính thức
    await fs.rename(req.file.path, newFilePath);

    return res.status(200).json({
      success: true,
      message: "Upload file thành công",
      fileName: newFileName,
      filePath: `/uploads/grade-files/${newFileName}`,
    });
  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error("Error uploading file:", error);
    return res.status(500).json({
      error: "Lỗi khi upload file: " + error.message,
    });
  }
};

/**
 * Serve file để xem/download
 */
const getGradeFile = async (req, res) => {
  try {
    // Decode fileName từ URL (hỗ trợ UTF-8)
    let fileName = req.params.fileName;

    // Decode URL nếu cần
    try {
      fileName = decodeURIComponent(fileName);
    } catch (e) {
      // Nếu decode lỗi, dùng tên gốc
    }

    if (!fileName) {
      return res.status(400).json({
        error: "Tên file không hợp lệ",
      });
    }

    // Sanitize fileName để tránh path traversal
    const sanitizedFileName = path.basename(fileName);
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "grade-files",
      sanitizedFileName
    );

    // Kiểm tra file có tồn tại không
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: "File không tồn tại",
      });
    }

    // Xác định content type dựa trên extension
    const extension = path.extname(sanitizedFileName).toLowerCase().slice(1);
    const contentType = CONTENT_TYPES[extension] || "application/octet-stream";

    // Trả về file với encoding UTF-8 cho tên file
    // Sử dụng inline để hiển thị file trong browser, không tải về
    res.setHeader("Content-Type", contentType);

    // Kiểm tra query parameter để xác định xem có muốn download không
    const shouldDownload = req.query.download === "true";

    if (shouldDownload) {
      // Nếu có query ?download=true thì tải về
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(sanitizedFileName)}`
      );
    } else {
      // Mặc định hiển thị inline (xem trong browser)
      res.setHeader(
        "Content-Disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(sanitizedFileName)}`
      );
    }

    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving file:", error);
    return res.status(500).json({
      error: "Lỗi khi đọc file: " + error.message,
    });
  }
};

// Helper functions
/**
 * Decode filename để hỗ trợ UTF-8 (tiếng Việt)
 */
const decodeFileName = (fileName) => {
  try {
    if (fileName.includes("%")) {
      return decodeURIComponent(fileName);
    }
    const decoded = Buffer.from(fileName, "latin1").toString("utf8");
    return decoded !== fileName ? decoded : fileName;
  } catch (e) {
    console.log(
      "Warning: Could not decode filename, using original:",
      fileName
    );
    return fileName;
  }
};

/**
 * Sanitize tên file: loại bỏ ký tự đặc biệt nhưng giữ tiếng Việt
 */
const sanitizeFileName = (baseName) => {
  return baseName
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Tìm tên file không trùng trong database
 */
const findUniqueFileName = async (baseName, extension) => {
  let fileName = `${baseName}${extension}`;
  let counter = 1;
  const MAX_ATTEMPTS = 1000;

  while (counter <= MAX_ATTEMPTS) {
    const existingFile = await GradeProposal.findOne({
      where: { attachmentFile: fileName },
    });

    if (!existingFile) {
      return fileName;
    }

    fileName = `${baseName}(${counter})${extension}`;
    counter++;
  }

  // Nếu quá nhiều file trùng, thêm timestamp
  return `${baseName}_${Date.now()}${extension}`;
};

module.exports = {
  uploadGradeFile,
  getGradeFile,
  uploadFileMiddleware,
};

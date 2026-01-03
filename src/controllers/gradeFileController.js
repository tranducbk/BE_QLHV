const path = require("path");
const fs = require("fs").promises;

/**
 * Content types cho backward compatibility (file cũ lưu local)
 */
const CONTENT_TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/**
 * DEPRECATED: Upload file đã được chuyển sang UploadThing SDK
 * Route này được giữ lại để backward compatibility
 * Frontend nên sử dụng UploadThing components thay vì route này
 */
const uploadGradeFile = async (req, res) => {
  return res.status(410).json({
    error:
      "Route này đã được deprecated. Vui lòng sử dụng UploadThing components trên frontend.",
    message:
      "Upload file giờ được xử lý trực tiếp bởi UploadThing SDK tại /api/uploadthing",
  });
};

/**
 * Serve file để xem/download
 * Hỗ trợ cả file từ UploadThing (URL) và file cũ (local) để backward compatibility
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGradeFile = async (req, res) => {
  try {
    let fileName = req.params.fileName;

    // Decode URL nếu cần (hỗ trợ UTF-8)
    try {
      fileName = decodeURIComponent(fileName);
    } catch {
      // Nếu decode lỗi, dùng tên gốc
    }

    if (!fileName) {
      return res.status(400).json({
        error: "Tên file không hợp lệ",
      });
    }

    // Kiểm tra xem fileName có phải là URL từ UploadThing không
    if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
      return res.redirect(fileName);
    }

    // Backward compatibility: Nếu là tên file cũ (local), vẫn hỗ trợ
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

    // Set headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Kiểm tra query parameter để xác định xem có muốn download không
    const shouldDownload = req.query.download === "true";
    const disposition = shouldDownload ? "attachment" : "inline";

    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename*=UTF-8''${encodeURIComponent(
        sanitizedFileName
      )}`
    );

    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({
      error: "Lỗi khi đọc file: " + error.message,
    });
  }
};

module.exports = {
  uploadGradeFile, // Deprecated - giữ lại để backward compatibility
  getGradeFile, // Vẫn cần để serve file cũ (local)
};

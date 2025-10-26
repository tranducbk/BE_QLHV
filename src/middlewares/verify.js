const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Đọc accessToken từ httpOnly cookie (ưu tiên) hoặc Authorization header (fallback)
  let accessToken = req.cookies?.accessToken;

  // Fallback: Nếu không có cookie, kiểm tra Authorization header
  if (!accessToken) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7); // Bỏ "Bearer " prefix
    }
  }

  if (!accessToken) {
    return res.status(401).json("Bạn chưa đăng nhập");
  }

  jwt.verify(
    accessToken,
    process.env.JWT_SECRET,
    (err, user) => {
      if (err) {
        // Phân biệt lỗi token hết hạn vs token không hợp lệ
        if (err.name === "TokenExpiredError") {
          return res.status(401).json("Token đã hết hạn");
        }
        return res.status(401).json("Token không hợp lệ");
      }
      req.user = user;
      next();
    }
  );
};

const isAdmin = (req, res, next) => {
  // Đọc accessToken từ httpOnly cookie (ưu tiên) hoặc Authorization header (fallback)
  let accessToken = req.cookies?.accessToken;

  // Fallback: Nếu không có cookie, kiểm tra Authorization header
  if (!accessToken) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7); // Bỏ "Bearer " prefix
    }
  }

  if (!accessToken) return res.status(401).json("Không tìm thấy token");

  jwt.verify(
    accessToken,
    process.env.JWT_SECRET,
    (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json("Token đã hết hạn");
        }
        return res.status(401).json("Token không hợp lệ");
      }
      if (user.admin === true) next();
      else return res.status(403).json("Không có quyền");
    }
  );
};

const isSuperAdmin = (req, res, next) => {
  // Đọc accessToken từ httpOnly cookie (ưu tiên) hoặc Authorization header (fallback)
  let accessToken = req.cookies?.accessToken;

  // Fallback: Nếu không có cookie, kiểm tra Authorization header
  if (!accessToken) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7); // Bỏ "Bearer " prefix
    }
  }

  if (!accessToken) return res.status(401).json("Không tìm thấy token");

  jwt.verify(
    accessToken,
    process.env.JWT_SECRET,
    (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json("Token đã hết hạn");
        }
        return res.status(401).json("Token không hợp lệ");
      }
      if (user.role === "SUPER_ADMIN") next();
      else
        return res.status(403).json("Bạn không có quyền quản lý admin users");
    }
  );
};

module.exports = { verifyToken, isAdmin, isSuperAdmin };

const jwt = require("jsonwebtoken");

/**
 * Middleware xác thực tùy chọn - không bắt buộc token
 * Nếu có token hợp lệ thì lưu vào req.user, nếu không thì tiếp tục
 */
const optionalVerify = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const accessToken = authHeader.substring(7);
    
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      // Tiếp tục dù token hợp lệ hay không
      next();
    });
  } else {
    // Không có token, vẫn tiếp tục
    next();
  }
};

module.exports = { optionalVerify };


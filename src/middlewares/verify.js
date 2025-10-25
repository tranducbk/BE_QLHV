const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.token;
  if (authHeader) {
    const accessToken = authHeader.split(" ")[1];
    // if (
    //   global.accessTokenList &&
    //   !global.accessTokenList.includes(accessToken)
    // ) {
    //   return res.status(403).json("Token không hợp lệ");
    // }
    jwt.verify(
      accessToken,
      process.env.JWT_SECRET || "your-super-secret-jwt-key-here",
      (err, user) => {
        if (err) {
          return res.status(403).json("Token không hợp lệ");
        }
        req.user = user;
        next();
      }
    );
  } else {
    return res.status(401).json("Bạn chưa đăng nhập");
  }
};

const isAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.token;

  if (!authHeader) return res.status(401).json("Không tìm thấy token");

  jwt.verify(
    authHeader.split(" ")[1],
    process.env.JWT_SECRET || "your-super-secret-jwt-key-here",
    (err, user) => {
      if (err) return res.status(401).json("Token không hợp lệ");
      if (user.admin === true) next();
      else return res.status(403).json("Không có quyền");
    }
  );
};

const isSuperAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.token;

  if (!authHeader) return res.status(401).json("Không tìm thấy token");

  jwt.verify(
    authHeader.split(" ")[1],
    process.env.JWT_SECRET || "your-super-secret-jwt-key-here",
    (err, user) => {
      if (err) return res.status(401).json("Token không hợp lệ");
      if (user.role === "SUPER_ADMIN") next();
      else
        return res.status(403).json("Bạn không có quyền quản lý admin users");
    }
  );
};

module.exports = { verifyToken, isAdmin, isSuperAdmin };

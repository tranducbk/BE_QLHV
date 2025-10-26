const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { User, Student, Commander } = require("../models");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         username:
 *           type: string
 *           description: Username
 *         isAdmin:
 *           type: boolean
 *           description: Is admin user
 *         studentId:
 *           type: string
 *           description: Student ID if user is student
 *         commanderId:
 *           type: string
 *           description: Commander ID if user is commander
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Username
 *         password:
 *           type: string
 *           description: Password
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Username
 *         password:
 *           type: string
 *           description: Password
 *         isAdmin:
 *           type: boolean
 *           description: Is admin user
 *     LoginResponse:
 *       type: object
 *       properties:
 *         other:
 *           $ref: '#/components/schemas/User'
 *         accessToken:
 *           type: string
 *           description: JWT access token
 */

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Người dùng đã tồn tại
 *       500:
 *         description: Lỗi server
 */
const Register = async (req, res) => {
  try {
    const existingUser = await User.findOne({
      where: { username: req.body.username },
    });

    if (existingUser)
      return res.status(400).json({ message: "Người dùng đã tồn tại" });

    let newUser;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    if (req.body.isAdmin) {
      // Tạo Commander với thông tin cơ bản
      const newCommander = await Commander.create({
        commanderId: req.body.commanderId || "", // Mã quân nhân
        fullName: req.body.fullName || "",
        phoneNumber: req.body.phoneNumber || "",
        email: req.body.email || "",
        unit: req.body.unit || "",
        rank: req.body.rank || "",
        positionGovernment: req.body.positionGovernment || "",
        positionParty: req.body.positionParty || "",
      });
      newUser = await User.create({
        username: req.body.username,
        password: hashedPassword,
        isAdmin: true,
        role: req.body.role || "ADMIN", // SUPER_ADMIN hoặc ADMIN
        commanderId: newCommander.id,
      });
    } else {
      // Kiểm tra các trường bắt buộc cho student
      if (!req.body.fullName || !req.body.studentId) {
        return res.status(400).json({
          message: "Thiếu thông tin bắt buộc: fullName và studentId",
        });
      }

      // Tạo Student với thông tin bắt buộc
      const newStudent = await Student.create({
        studentId: req.body.studentId, // Mã học viên (bắt buộc)
        fullName: req.body.fullName, // Họ tên (bắt buộc)
      });
      newUser = await User.create({
        username: req.body.username,
        password: hashedPassword,
        isAdmin: false,
        role: "USER",
        studentId: newStudent.id,
      });
    }
    return res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    console.log("Đăng ký thất bại: ", error);
    return res.status(500).json({ message: "Đăng ký thất bại" });
  }
};

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       404:
 *         description: Tên đăng nhập hoặc mật khẩu không đúng
 *       500:
 *         description: Lỗi server
 */
const Login = async (req, res) => {
  try {
    const user = await User.findOne({ where: { username: req.body.username } });

    if (!user) {
      return res.status(404).json("Tên đăng nhập không đúng");
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword) {
      return res.status(404).json("Mật khẩu không đúng");
    }

    // Access Token: 15 phút (ngắn, an toàn)
    const accessToken = jwt.sign(
      {
        id: user.id,
        admin: user.isAdmin,
        role: user.role || (user.isAdmin ? "ADMIN" : "USER"),
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Refresh Token: 7 ngày (dài, lưu trong httpOnly cookie)
    const refreshToken = jwt.sign(
      {
        id: user.id,
        admin: user.isAdmin,
        role: user.role || (user.isAdmin ? "ADMIN" : "USER"),
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Lưu refreshToken vào database để có thể revoke
    await user.update({ refreshToken });

    // Cookie settings cho cloud deployment
    const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";
    const isProduction = process.env.NODE_ENV === "production";

    console.log("🌐 Request secure:", req.secure);
    console.log("🌐 X-Forwarded-Proto:", req.headers["x-forwarded-proto"]);
    console.log("🌐 Is HTTPS:", isHttps);
    console.log("🌐 Is Production:", isProduction);

    const cookieOptions = {
      httpOnly: true,
      secure: isHttps, // Chỉ secure khi HTTPS
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 phút
    };

    const refreshCookieOptions = {
      httpOnly: true,
      secure: isHttps, // Chỉ secure khi HTTPS
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    };

    // Lưu access token vào httpOnly cookie
    res.cookie("accessToken", accessToken, cookieOptions);

    // Lưu refresh token vào httpOnly cookie
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    console.log("🍪 Cookies set successfully");
    console.log("🍪 Response headers:", res.getHeaders());
    console.log("🍪 Set-Cookie headers:", res.getHeaders()["set-cookie"]);

    // Kiểm tra cookies có được set không
    const setCookieHeaders = res.getHeaders()["set-cookie"];
    if (setCookieHeaders) {
      console.log("✅ Cookies được set:", setCookieHeaders.length, "cookies");
      setCookieHeaders.forEach((cookie, index) => {
        console.log(`🍪 Cookie ${index + 1}:`, cookie);
      });
    } else {
      console.log("❌ Không có cookies được set!");
    }

    const { password, refreshToken: _, ...other } = user.toJSON();

    // Fallback: Trả tokens về frontend nếu cookies không hoạt động
    // Frontend sẽ kiểm tra cookies và fallback về localStorage nếu cần
    res.status(200).json({
      user: other,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Đăng nhập thất bại", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    if (req.body.newPassword !== req.body.confirmPassword) {
      return res.status(401).json("Xác nhận mật khẩu mới chưa trùng khớp");
    }

    const users = await User.findByPk(req.params.userId);

    if (!users) {
      return res.status(404).json("Nguời dùng không tồn tại");
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      users.password
    );

    if (!validPassword) {
      return res.status(404).json("Mật khẩu cũ không đúng");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(req.body.newPassword, salt);

    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json("Người dùng không tồn tại");
    await user.update({ password: hashedNewPassword });

    if (!user) {
      return res.status(404).json("Người dùng không tồn tại");
    }

    return res
      .status(200)
      .json(`Cập nhật mật khẩu mới thành công cho user: ${user.username}`);
  } catch (error) {
    console.error(error);
    return res.status(500).json("Lỗi server");
  }
};

const Logout = async (req, res) => {
  try {
    // Xóa refreshToken khỏi database (revoke token)
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.id) {
        await User.update(
          { refreshToken: null },
          { where: { id: decoded.id } }
        );
      }
    }

    // Clear cookies với cùng options như khi set
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true, // Bắt buộc true cho SameSite: "none"
      path: "/",
      sameSite: "none", // Luôn "none" cho cross-origin
      domain: undefined, // Không set domain để hoạt động trên tất cả máy
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true, // Bắt buộc true cho SameSite: "none"
      path: "/",
      sameSite: "none", // Luôn "none" cho cross-origin
      domain: undefined, // Không set domain để hoạt động trên tất cả máy
    });
    return res.status(200).json("Đăng xuất thành công");
  } catch (error) {
    return res.status(500).json(error);
  }
};

/**
 * Refresh access token using refresh token (với token rotation)
 */
const refreshAccessToken = async (req, res) => {
  try {
    // Lấy refresh token từ cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token không tồn tại" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Kiểm tra trong database: Token có bị revoke không?
    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(401)
        .json({ message: "Refresh token không hợp lệ hoặc đã bị thu hồi" });
    }

    // Tạo access token mới
    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        admin: decoded.admin,
        role: decoded.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Tạo refresh token mới (Token Rotation)
    const newRefreshToken = jwt.sign(
      {
        id: decoded.id,
        admin: decoded.admin,
        role: decoded.role,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Lưu refreshToken mới vào database (vô hiệu hóa token cũ)
    await user.update({ refreshToken: newRefreshToken });

    // Cookie settings cho cloud deployment
    const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";

    const cookieOptions = {
      httpOnly: true,
      secure: isHttps, // Chỉ secure khi HTTPS
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 phút
    };

    const refreshCookieOptions = {
      httpOnly: true,
      secure: isHttps, // Chỉ secure khi HTTPS
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    };

    // Lưu access token vào httpOnly cookie
    res.cookie("accessToken", newAccessToken, cookieOptions);

    // Lưu refresh token mới vào httpOnly cookie
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    // Fallback: Trả tokens về frontend nếu cookies không hoạt động
    return res.status(200).json({
      message: "Token đã được làm mới",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // Refresh token hết hạn -> yêu cầu đăng nhập lại
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true, // Bắt buộc true cho SameSite: "none"
        path: "/",
        sameSite: "none", // Luôn "none" cho cross-origin
        domain: undefined, // Không set domain để hoạt động trên tất cả máy
      });
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true, // Bắt buộc true cho SameSite: "none"
        path: "/",
        sameSite: "none", // Luôn "none" cho cross-origin
        domain: undefined, // Không set domain để hoạt động trên tất cả máy
      });
      return res.status(401).json({
        message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
      });
    }
    return res.status(401).json({ message: "Refresh token không hợp lệ" });
  }
};

module.exports = {
  Register,
  Login,
  Logout,
  changePassword,
  refreshAccessToken,
};

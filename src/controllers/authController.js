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

    // Refresh Token: 1 ngày
    const refreshToken = jwt.sign(
      {
        id: user.id,
        admin: user.isAdmin,
        role: user.role || (user.isAdmin ? "ADMIN" : "USER"),
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "1d" }
    );

    // Không lưu refreshToken vào database - chỉ dùng cookie (stateless JWT)

    // Cookie settings cho cloud deployment
    const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";
    const isProduction = process.env.NODE_ENV === "production";

    // Chỉ set refreshToken vào httpOnly cookie
    // accessToken chỉ trả về trong response body, frontend lưu vào localStorage
    const refreshCookieOptions = {
      httpOnly: true,
      secure: isHttps, // Chỉ secure khi HTTPS
      sameSite: isProduction ? "none" : "lax", // None cho cross-origin, Lax cho localhost
      path: "/",
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    };

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    const { password, refreshToken: _, ...other } = user.toJSON();

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
    // Clear refreshToken cookie (accessToken không lưu trong cookie)
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
    // Debug: Log cookies để kiểm tra
    if (process.env.NODE_ENV === "development") {
      console.log("[Refresh] Cookies received:", req.cookies);
      console.log(
        "[Refresh] Has refreshToken cookie:",
        !!req.cookies?.refreshToken
      );
      console.log("[Refresh] Request body:", req.body);
    }

    // Lấy refresh token từ cookie (ưu tiên) hoặc từ request body (fallback cho localStorage)
    let refreshToken = req.cookies?.refreshToken;

    // Fallback: Nếu không có cookie, lấy từ request body hoặc Authorization header
    if (!refreshToken) {
      refreshToken = req.body.refreshToken;
    }
    if (!refreshToken) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        refreshToken = authHeader.substring(7);
      }
    }

    if (!refreshToken) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[Refresh] No refresh token found in cookies, body, or header"
        );
      }
      return res.status(401).json({ message: "Refresh token không tồn tại" });
    }

    // Verify refresh token (chỉ verify signature và expiry - stateless)
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Kiểm tra user có tồn tại không
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại" });
    }

    // Tạo access token mới (15 phút)
    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        admin: decoded.admin,
        role: decoded.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // KHÔNG tạo refreshToken mới khi refresh
    // Chỉ tạo refreshToken mới khi đăng nhập
    // Giữ nguyên refreshToken cũ để đảm bảo thời gian hết hạn cố định (1 ngày từ lúc đăng nhập)

    // Trả accessToken về frontend (không set vào cookie)
    // Frontend sẽ lưu vào localStorage
    return res.status(200).json({
      message: "Token đã được làm mới",
      accessToken: newAccessToken,
      // Không trả refreshToken vì không tạo mới
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

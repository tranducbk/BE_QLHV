require("dotenv").config();
const moment = require("moment");
const {
  User,
  Student,
  Commander,
  CommanderDutySchedule,
  University,
  Organization,
  EducationLevel,
  ClassModel,
  SemesterResult,
  TimeTable,
  TuitionFee,
  Notification,
  CutRice,
  YearlyAchievement,
  YearlyResult,
  ScientificInitiative,
  ScientificTopic,
  Achievement,
  AchievementProfile,
} = require("../models");
const { Op } = require("sequelize");
const limit = 11;

const getUser = async (req, res) => {
  try {
    // Kiểm tra quyền truy cập - chỉ cho phép xem thông tin của chính mình
    const requestingUserId = req.user?.id; // Từ JWT token
    const targetUserId = req.params.userId;

    // Chỉ cho phép xem thông tin của chính mình (trừ SUPER_ADMIN có thể xem tất cả)
    if (requestingUserId !== targetUserId && req.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Bạn chỉ có thể xem thông tin của chính mình",
      });
    }

    const user = await User.findByPk(req.params.userId, {
      include: [
        {
          model: Student,
          include: [
            {
              model: University,
              attributes: ["id", "universityCode", "universityName"],
            },
            {
              model: Organization,
              attributes: ["id", "organizationName", "travelTime"],
            },
            { model: EducationLevel, attributes: ["id", "levelName"] },
            { model: ClassModel, attributes: ["id", "className"] },
          ],
        },
        {
          model: Commander,
        },
      ],
    });

    if (!user)
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    // Thêm avatar vào user object
    let avatar = null;
    if (user.student && user.student.avatar) {
      avatar = user.student.avatar;
    } else if (user.commander && user.commander.avatar) {
      avatar = user.commander.avatar;
    }

    const plain = user.toJSON();
    const userWithAvatar = { ...plain, avatar };

    return res.status(200).json(userWithAvatar);
  } catch (error) {
    console.error("Error in getUser:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const getCommanderDutySchedules = async (req, res) => {
  const { fullName, date, page } = req.query;

  let startOfDay, endOfDay;

  const skip = (page - 1) * limit;
  try {
    let query = {};

    if (!date) {
      const currentDate = new Date();
      startOfDay = moment(currentDate).startOf("day").toDate();
      endOfDay = moment(currentDate).endOf("day").toDate();
    } else {
      // Chuyển đổi chuỗi date sang định dạng ISO 8601
      const isoDate = moment(date, "ddd MMM DD YYYY HH:mm:ss").toISOString();

      // Chuyển đổi chuỗi ISO 8601 này thành đối tượng Date và lấy startOfDay và endOfDay
      startOfDay = moment(isoDate).startOf("day").toDate();
      endOfDay = moment(isoDate).endOf("day").toDate();
    }

    if (fullName) query.fullName = { [Op.iLike]: `%${fullName}%` };

    const where = { ...query };
    if (date) where.workDay = { [Op.between]: [startOfDay, endOfDay] };

    const { rows: schedules, count: totalCount } =
      await CommanderDutySchedule.findAndCountAll({
        where,
        order: [["workDay", "DESC"]],
        offset: skip,
        limit,
      });

    // Tính toán tổng số trang
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({ schedules, totalPages });
  } catch (error) {
    console.error(error);
    return res.status(500).json("Lỗi server");
  }
};

const getCommanderDutySchedule = async (req, res) => {
  try {
    let { year, month, page } = req.query;
    const skip = (page - 1) * limit;

    // Nếu không có tháng và năm được truyền vào, sử dụng thời gian hiện tại
    if (!year || !month) {
      const currentDate = new Date();
      year = String(currentDate.getFullYear());
      month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Lấy tháng hiện tại, bắt đầu từ 0
    }

    // Tính toán ngày bắt đầu và kết thúc của tháng được chỉ định
    const startOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf(
      "month"
    );
    const endOfMonth = moment(startOfMonth).endOf("month");

    const { rows: schedules, count: totalCount } =
      await CommanderDutySchedule.findAndCountAll({
        where: {
          workDay: {
            [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()],
          },
        },
        order: [["workDay", "DESC"]],
        offset: skip,
        limit,
      });

    // Tính toán tổng số trang
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({ schedules, totalPages });
  } catch (error) {
    console.error(error);
    return res.status(500).json("Lỗi server");
  }
};

const getCommanderDutySchedulesCurrent = async (req, res) => {
  try {
    const schedules = await CommanderDutySchedule.findAll({
      order: [["workDay", "DESC"]],
    });

    return res.status(200).json(schedules);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCommanderDutyScheduleByUserId = async (req, res) => {
  try {
    const schedule = await CommanderDutySchedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Không tìm thấy lịch trực" });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const updateCommanderDutySchedule = async (req, res) => {
  try {
    // Kiểm tra trùng ngày trực (loại trừ chính record đang được update)
    const existingSchedule = await CommanderDutySchedule.findOne({
      where: { workDay: req.body.workDay, id: { [Op.ne]: req.params.id } },
    });

    if (existingSchedule) {
      return res.status(400).json({
        message: `Đã có lịch trực cho ngày ${moment(req.body.workDay).format(
          "DD/MM/YYYY"
        )}. Vui lòng chọn ngày khác.`,
      });
    }

    const updatedSchedule = await CommanderDutySchedule.findByPk(req.params.id);
    if (!updatedSchedule)
      return res.status(404).json({ message: "Không tìm thấy lịch trực" });
    await updatedSchedule.update(req.body);
    return res.status(200).json(updatedSchedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCommanderDutySchedule = async (req, res) => {
  try {
    // Kiểm tra trùng ngày trực
    const existingSchedule = await CommanderDutySchedule.findOne({
      where: { workDay: req.body.workDay },
    });

    if (existingSchedule) {
      return res.status(400).json({
        message: `Đã có lịch trực cho ngày ${moment(req.body.workDay).format(
          "DD/MM/YYYY"
        )}. Vui lòng chọn ngày khác.`,
      });
    }

    const newSchedule = await CommanderDutySchedule.create({
      fullName: req.body.fullName,
      workDay: req.body.workDay,
      rank: req.body.rank,
      phoneNumber: req.body.phoneNumber,
      position: req.body.position,
    });
    return res.status(201).json(newSchedule);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteCommanderDutySchedule = async (req, res) => {
  try {
    await CommanderDutySchedule.destroy({ where: { id: req.params.id } });
    return res.status(200).json({ message: "Xóa thành công" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// API khởi tạo Super Admin đầu tiên (chỉ chạy 1 lần)
const initializeSuperAdmin = async (req, res) => {
  try {
    const bcrypt = require("bcrypt");

    // Kiểm tra xem đã có super admin chưa
    const existingSuperAdmin = await User.findOne({
      where: { role: "SUPER_ADMIN" },
    });

    if (existingSuperAdmin) {
      return res.status(400).json({
        message: "Super Admin đã tồn tại trong hệ thống",
      });
    }

    // Kiểm tra username "superadmin" đã tồn tại chưa
    const existingUser = await User.findOne({
      where: { username: "superadmin" },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username 'superadmin' đã tồn tại",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("123456", 10);

    // Tạo Commander cho Super Admin
    const newCommander = await Commander.create({
      commanderId: "SA001",
      fullName: "Super Administrator",
      unit: "Ban Quản trị hệ thống",
      phoneNumber: "",
      email: "",
    });

    // Tạo Super Admin User
    const superAdmin = await User.create({
      username: "superadmin",
      password: hashedPassword,
      isAdmin: true,
      role: "SUPER_ADMIN",
      commanderId: newCommander.id,
    });

    return res.status(201).json({
      message: "Khởi tạo Super Admin thành công",
      username: "superadmin",
      password: "123456",
      note: "Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu",
    });
  } catch (error) {
    console.error("Error in initializeSuperAdmin:", error);
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// API lấy TẤT CẢ tài khoản trong hệ thống - Chỉ trả về thông tin cơ bản
const getAllAdminUsers = async (req, res) => {
  try {
    const { page = 1, search, role, pageSize, unit } = req.query;
    const currentLimit = pageSize ? parseInt(pageSize) : limit;
    const skip = (page - 1) * currentLimit;

    // Loại bỏ SUPER_ADMIN khỏi danh sách
    let query = {
      role: { [Op.ne]: "SUPER_ADMIN" },
    };

    // Filter theo role nếu có
    if (role && role !== "ALL") {
      query.role = role; // ADMIN hoặc USER
    }

    if (search) {
      // Tìm trong Commander
      const commanders = await Commander.findAll({
        where: {
          fullName: { [Op.iLike]: `%${search}%` },
        },
        attributes: ["id"],
      });

      // Tìm trong Student
      const students = await Student.findAll({
        where: {
          fullName: { [Op.iLike]: `%${search}%` },
        },
        attributes: ["id"],
      });

      const commanderIds = commanders.map((c) => c.id);
      const studentIds = students.map((s) => s.id);

      query[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { commanderId: { [Op.in]: commanderIds } },
        { studentId: { [Op.in]: studentIds } },
      ];
    }

    // Filter theo unit nếu có
    if (unit && unit !== "ALL") {
      // Tìm các Commander có unit này
      const commandersByUnit = await Commander.findAll({
        where: {
          unit: { [Op.iLike]: `%${unit}%` },
        },
        attributes: ["id"],
      });

      // Tìm các Student có unit này
      const studentsByUnit = await Student.findAll({
        where: {
          unit: { [Op.iLike]: `%${unit}%` },
        },
        attributes: ["id"],
      });

      const commanderIdsByUnit = commandersByUnit.map((c) => c.id);
      const studentIdsByUnit = studentsByUnit.map((s) => s.id);

      // Thêm điều kiện filter theo unit vào query
      if (query[Op.or]) {
        // Nếu đã có Op.or từ search, thêm điều kiện unit vào
        query[Op.and] = [
          { [Op.or]: query[Op.or] },
          {
            [Op.or]: [
              { commanderId: { [Op.in]: commanderIdsByUnit } },
              { studentId: { [Op.in]: studentIdsByUnit } },
            ],
          },
        ];
        delete query[Op.or];
      } else {
        query[Op.or] = [
          { commanderId: { [Op.in]: commanderIdsByUnit } },
          { studentId: { [Op.in]: studentIdsByUnit } },
        ];
      }
    }

    const { rows: users, count: totalCount } = await User.findAndCountAll({
      where: query,
      include: [
        {
          model: Commander,
          attributes: ["fullName", "unit", "birthday", "avatar"],
          required: false,
        },
        {
          model: Student,
          attributes: ["fullName", "unit", "birthday", "avatar"],
          required: false,
        },
      ],
      attributes: ["id", "username", "role", "isAdmin", "createdAt"],
      order: [["createdAt", "DESC"]],
      offset: skip,
      limit: currentLimit,
    });

    // Format response - chỉ trả về thông tin cần thiết
    const formattedUsers = users.map((user) => {
      // Ưu tiên lấy thông tin từ Commander nếu là admin, không thì từ Student
      const profile = user.commander || user.student;

      return {
        id: user.id,
        username: user.username,
        role: user.role || "USER", // Chỉ dùng role
        fullName: profile?.fullName || "",
        unit: profile?.unit || "",
        birthday: profile?.birthday || null,
        avatar: profile?.avatar || null,
        createdAt: user.createdAt,
      };
    });

    const totalPages = Math.ceil(totalCount / currentLimit);

    return res
      .status(200)
      .json({ users: formattedUsers, totalPages, totalCount });
  } catch (error) {
    console.error("Error in getAllAdminUsers:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const getAdminUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Commander,
          attributes: ["fullName", "unit", "birthday", "avatar"],
        },
        {
          model: Student,
          attributes: ["fullName", "unit", "birthday", "avatar"],
        },
      ],
      attributes: ["id", "username", "role", "isAdmin", "createdAt"],
    });

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    // Lấy thông tin từ Commander hoặc Student
    const profile = user.commander || user.student;

    // Format response - chỉ trả về thông tin cần thiết
    const formattedUser = {
      id: user.id,
      username: user.username,
      role: user.role || "USER", // Chỉ dùng role
      fullName: profile?.fullName || "",
      unit: profile?.unit || "",
      birthday: profile?.birthday || null,
      avatar: profile?.avatar || null,
      createdAt: user.createdAt,
    };

    return res.status(200).json(formattedUser);
  } catch (error) {
    console.error("Error in getAdminUser:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const bcrypt = require("bcrypt");
    const { v4: uuidv4 } = require("uuid");

    // Validation - chỉ bắt buộc username và password
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({
        message: "Thiếu thông tin: username và password là bắt buộc",
      });
    }

    // Kiểm tra username đã tồn tại
    const existingUser = await User.findOne({
      where: { username: req.body.username },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username đã tồn tại" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const role = req.body.role || "USER";

    // Validate role
    if (!["SUPER_ADMIN", "ADMIN", "USER"].includes(role)) {
      return res.status(400).json({
        message: "Role không hợp lệ. Chỉ chấp nhận: SUPER_ADMIN, ADMIN, USER",
      });
    }

    let profileId;
    let profile;

    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      // Tạo Commander cho SUPER_ADMIN và ADMIN
      const newCommander = await Commander.create({
        id: uuidv4(),
        commanderId: req.body.commanderId || uuidv4(), // Dùng UUID nếu không có commanderId
        fullName: req.body.fullName || req.body.username, // Dùng username nếu không có fullName
        unit: req.body.unit || "Chưa có đơn vị", // Giá trị mặc định
        birthday: req.body.birthday || null,
        avatar:
          req.body.avatar ||
          "https://i.pinimg.com/736x/d4/a1/ff/d4a1ff9d0f243e50062e2b21f2f2496d.jpg",
        phoneNumber: "",
        email: "",
        gender: "",
        rank: "",
        positionGovernment: "",
        positionParty: "",
      });
      profileId = newCommander.id;
      profile = newCommander;
    } else {
      // Tạo Student cho USER
      const currentYear = new Date().getFullYear();
      const defaultEnlistmentDate = new Date(currentYear, 9, 1); // 01/10/năm hiện tại (tháng 9 vì index từ 0)

      const newStudent = await Student.create({
        id: uuidv4(),
        studentId: req.body.studentId || uuidv4(), // Dùng UUID nếu không có studentId
        fullName: req.body.fullName || req.body.username, // Dùng username nếu không có fullName
        unit: req.body.unit || "Chưa có đơn vị", // Giá trị mặc định
        birthday: req.body.birthday || null,
        avatar:
          req.body.avatar ||
          "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg",
        phoneNumber: "",
        email: "",
        gender: "",
        ethnicity: "",
        religion: "",
        hometown: "",
        placeOfBirth: "",
        currentAddress: "",
        enrollment: req.body.enrollment || currentYear, // Mặc định: năm hiện tại
        dateOfEnlistment: req.body.dateOfEnlistment || defaultEnlistmentDate, // Mặc định: 01/10/năm hiện tại
      });
      profileId = newStudent.id;
      profile = newStudent;
    }

    // Tạo User - chỉ dùng role để xác định quyền
    const newUser = await User.create({
      id: uuidv4(),
      username: req.body.username,
      password: hashedPassword,
      isAdmin: role === "SUPER_ADMIN" || role === "ADMIN", // Backward compatibility
      role: role,
      commanderId:
        role === "SUPER_ADMIN" || role === "ADMIN" ? profileId : null,
      studentId: role === "USER" ? profileId : null,
    });

    // Format response
    const formattedUser = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      fullName: profile.fullName,
      unit: profile.unit,
      birthday: profile.birthday,
      avatar: profile.avatar,
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({
      message: `Tạo tài khoản ${role} thành công`,
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error in createAdminUser:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Commander }, { model: Student }],
    });

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    // Kiểm tra username mới nếu có thay đổi
    if (req.body.username && req.body.username !== user.username) {
      const existingUser = await User.findOne({
        where: {
          username: req.body.username,
          id: { [Op.ne]: user.id },
        },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Username đã tồn tại" });
      }

      // Cập nhật username
      await user.update({ username: req.body.username });
    }

    // Cập nhật role nếu có - validate trước
    if (req.body.role && req.body.role !== user.role) {
      if (!["SUPER_ADMIN", "ADMIN", "USER"].includes(req.body.role)) {
        return res.status(400).json({
          message: "Role không hợp lệ. Chỉ chấp nhận: SUPER_ADMIN, ADMIN, USER",
        });
      }

      // Cập nhật role và isAdmin
      await user.update({
        role: req.body.role,
        isAdmin: req.body.role === "SUPER_ADMIN" || req.body.role === "ADMIN",
      });
    }

    // Cập nhật password nếu có
    if (req.body.password && req.body.password.trim() !== "") {
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      await user.update({ password: hashedPassword });
    }

    // Cập nhật thông tin profile - CHỈ CÁC FIELD CƠ BẢN
    const profile = user.commander || user.student;
    if (profile) {
      await profile.update({
        fullName: req.body.fullName || profile.fullName,
        unit: req.body.unit || profile.unit,
        birthday:
          req.body.birthday !== undefined
            ? req.body.birthday
            : profile.birthday,
        avatar: req.body.avatar || profile.avatar,
      });
    }

    // Lấy thông tin user đã cập nhật
    const updatedUser = await User.findByPk(user.id, {
      include: [
        {
          model: Commander,
          attributes: ["fullName", "unit", "birthday", "avatar"],
        },
        {
          model: Student,
          attributes: ["fullName", "unit", "birthday", "avatar"],
        },
      ],
      attributes: ["id", "username", "role", "createdAt"],
    });

    const updatedProfile = updatedUser.commander || updatedUser.student;

    // Format response
    const formattedUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      fullName: updatedProfile?.fullName || "",
      unit: updatedProfile?.unit || "",
      birthday: updatedProfile?.birthday || null,
      avatar: updatedProfile?.avatar || null,
      createdAt: updatedUser.createdAt,
    };

    return res.status(200).json({
      message: "Cập nhật tài khoản thành công",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error in updateAdminUser:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Commander }, { model: Student }],
    });

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    // Không cho phép xóa SUPER_ADMIN (trừ khi người xóa cũng là SUPER_ADMIN)
    if (user.role === "SUPER_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Chỉ SUPER_ADMIN mới có thể xóa tài khoản SUPER_ADMIN khác",
      });
    }

    // Không cho phép xóa chính mình
    const requestingUserId = req.user.id; // Từ JWT token
    if (user.id === requestingUserId) {
      return res.status(400).json({ message: "Không thể xóa chính mình" });
    }

    // Xóa tất cả thông tin liên quan trước
    if (user.commanderId) {
      // Xóa Commander và tất cả thông tin liên quan
      await Commander.destroy({ where: { id: user.commanderId } });
    }

    if (user.studentId) {
      // Xóa tất cả thông tin liên quan đến Student
      const studentId = user.studentId;

      // Xóa các bảng liên quan đến student

      // Lấy tất cả yearlyAchievementId của student để xóa scientific_initiatives
      const yearlyAchievements = await YearlyAchievement.findAll({
        where: { studentId },
        attributes: ["id"],
      });
      const yearlyAchievementIds = yearlyAchievements.map((ya) => ya.id);

      await Promise.all([
        // Xóa kết quả học tập
        SemesterResult.destroy({ where: { studentId } }),
        // Xóa thời khóa biểu
        TimeTable.destroy({ where: { studentId } }),
        // Xóa học phí
        TuitionFee.destroy({ where: { studentId } }),
        // Xóa thông báo
        Notification.destroy({ where: { studentId } }),
        // Xóa cắt cơm
        CutRice.destroy({ where: { studentId } }),
        // Xóa thành tích
        Achievement.destroy({ where: { studentId } }),
        // Xóa hồ sơ thành tích
        AchievementProfile.destroy({ where: { studentId } }),
        // Xóa sáng kiến khoa học (qua yearlyAchievementId)
        yearlyAchievementIds.length > 0
          ? ScientificInitiative.destroy({
              where: { yearlyAchievementId: yearlyAchievementIds },
            })
          : Promise.resolve(),
        // Xóa đề tài khoa học (qua yearlyAchievementId)
        yearlyAchievementIds.length > 0
          ? ScientificTopic.destroy({
              where: { yearlyAchievementId: yearlyAchievementIds },
            })
          : Promise.resolve(),
        // Xóa kết quả hàng năm
        YearlyResult.destroy({ where: { studentId } }),
        // Xóa thành tích hàng năm (sau khi xóa scientific_initiatives)
        YearlyAchievement.destroy({ where: { studentId } }),
      ]);

      // Cuối cùng xóa Student
      await Student.destroy({ where: { id: studentId } });
    }

    // Xóa User
    await User.destroy({ where: { id: user.id } });

    return res.status(200).json({ message: "Xóa tài khoản thành công" });
  } catch (error) {
    console.error("Error in deleteAdminUser:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

/**
 * Get current logged-in user info
 * Dùng để Frontend lấy thông tin user từ token (httpOnly cookie)
 */
const getCurrentUser = async (req, res) => {
  try {
    // req.user đã được set bởi verifyToken middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password", "refreshToken"] },
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports = {
  getUser,
  getCurrentUser, // Thêm endpoint mới
  getCommanderDutySchedules,
  getCommanderDutyScheduleByUserId,
  updateCommanderDutySchedule,
  createCommanderDutySchedule,
  deleteCommanderDutySchedule,
  getCommanderDutySchedule,
  getCommanderDutySchedulesCurrent,
  // Admin user management
  initializeSuperAdmin,
  getAllAdminUsers,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
};

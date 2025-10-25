const Semester = require("../models/semester");
const { Student, Notification } = require("../models");

// GET /semester
const getAllSemesters = async (req, res) => {
  try {
    const { q } = req.query;
    const { Op } = require("sequelize");
    const where = q
      ? {
          [Op.or]: [
            { code: { [Op.iLike]: `%${q}%` } },
            { schoolYear: { [Op.iLike]: `%${q}%` } },
          ],
        }
      : {};
    const semesters = await Semester.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(semesters);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

// GET /semester/:id
const getSemesterById = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findByPk(id);
    if (!semester)
      return res.status(404).json({ message: "Không tìm thấy kỳ" });
    return res.status(200).json(semester);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

// POST /semester/create
const createSemester = async (req, res) => {
  try {
    const { code, schoolYear } = req.body;
    if (!code || !schoolYear) {
      return res
        .status(400)
        .json({ message: "Thiếu dữ liệu bắt buộc (code, schoolYear)" });
    }
    const exists = await Semester.findOne({ where: { code, schoolYear } });
    if (exists)
      return res.status(409).json({
        message: `Học kỳ ${exists.code} - ${exists.schoolYear} đã tồn tại. Vui lòng kiểm tra lại.`,
      });

    const semester = await Semester.create({ code, schoolYear });

    // Tạo thông báo cho sinh viên về học kỳ mới
    try {
      const students = await Student.findAll({ attributes: ["id"] });
      if (students && students.length > 0) {
        const notifications = students.map((student) => ({
          studentId: student.id,
          title: `Thông báo học kỳ mới ${code} năm học ${schoolYear}`,
          content: `Học kỳ ${code} - ${schoolYear} đã được tạo. Vui lòng kiểm tra thông tin học tập và đăng ký theo quy định.`,
          type: "new_semester",
          link: "/users/semester-results",
          isRead: false,
        }));

        await Notification.bulkCreate(notifications);
      }
    } catch (notifyErr) {
      // Bỏ qua lỗi thông báo, không ảnh hưởng đến việc tạo semester
    }

    return res.status(201).json({
      ...semester.toJSON(),
      message: `Đã tạo học kỳ ${semester.code} - ${semester.schoolYear}`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

// PUT /semester/:id
const updateSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, schoolYear } = req.body;
    const update = {};
    if (code) update.code = code;
    if (schoolYear) update.schoolYear = schoolYear;
    update.updatedAt = new Date();

    if (code && schoolYear) {
      // ensure unique code and schoolYear combination
      const { Op } = require("sequelize");
      const exists = await Semester.findOne({
        where: {
          code,
          schoolYear,
          id: { [Op.ne]: id },
        },
      });
      if (exists)
        return res.status(409).json({
          message: `Học kỳ ${exists.code} - ${exists.schoolYear} đã tồn tại. Vui lòng kiểm tra lại.`,
        });
    }

    const semester = await Semester.findByPk(id);
    if (!semester)
      return res.status(404).json({ message: "Không tìm thấy kỳ" });
    await semester.update(update);
    return res.status(200).json({
      ...semester.toJSON(),
      message: `Đã cập nhật học kỳ ${semester.code} - ${semester.schoolYear}`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

// DELETE /semester/:id
const deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findByPk(id);
    if (!semester)
      return res.status(404).json({ message: "Không tìm thấy kỳ" });
    await semester.destroy();
    return res.status(200).json({
      message: `Đã xóa học kỳ ${semester.code} - ${semester.schoolYear}`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  getAllSemesters,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester,
};

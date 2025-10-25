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
} = require("../models");
const { Op } = require("sequelize");
const limit = 11;

const getUser = async (req, res) => {
  try {
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
          include: [
            {
              model: University,
              attributes: ["id", "universityCode", "universityName"],
            },
          ],
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
    return res.status(500).json({ message: "Lỗi server", error: error.message });
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

module.exports = {
  getUser,
  getCommanderDutySchedules,
  getCommanderDutyScheduleByUserId,
  updateCommanderDutySchedule,
  createCommanderDutySchedule,
  deleteCommanderDutySchedule,
  getCommanderDutySchedule,
  getCommanderDutySchedulesCurrent,
};

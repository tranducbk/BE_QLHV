const { TimeTable, User, Student } = require("../models");

const getTimeTable = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      include: [{ model: Student }],
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const student = user.student;

    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Lấy lịch học từ model time_table
    const timeTable = await TimeTable.findOne({
      where: { studentId: student.id },
    });

    if (!timeTable || !timeTable.schedules) {
      return res.json([]);
    }

    // Thêm id cho mỗi schedule nếu chưa có
    const { v4: uuidv4 } = require("uuid");
    const schedulesWithId = timeTable.schedules.map((schedule) => ({
      ...schedule,
      id: schedule.id || uuidv4(),
    }));

    return res.json(schedulesWithId);
  } catch (error) {
    return res.status(500).json("Lỗi server");
  }
};

const createTimeTable = async (req, res) => {
  try {
    const { userId } = req.params;
    const scheduleData = req.body;

    const user = await User.findByPk(userId, {
      include: [{ model: Student }],
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const student = user.student;

    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Tự động tạo time string từ startTime và endTime
    if (scheduleData.startTime && scheduleData.endTime) {
      scheduleData.time = `${scheduleData.startTime} - ${scheduleData.endTime}`;
    }

    // Thêm id cho schedule mới nếu chưa có
    if (!scheduleData.id) {
      const { v4: uuidv4 } = require("uuid");
      scheduleData.id = uuidv4();
    }

    // Tìm hoặc tạo timeTable cho sinh viên
    let timeTable = await TimeTable.findOne({
      where: { studentId: student.id },
    });

    if (!timeTable) {
      // Tạo mới timeTable cho sinh viên
      timeTable = await TimeTable.create({
        studentId: student.id,
        schedules: [scheduleData],
      });
    } else {
      // Thêm schedule vào timeTable hiện có
      const currentSchedules = timeTable.schedules || [];
      currentSchedules.push(scheduleData);

      // Sử dụng raw SQL để cập nhật JSONB field
      const { sequelize } = require("../services/sequelize");
      await sequelize.query(
        "UPDATE time_tables SET schedules = $1 WHERE id = $2",
        {
          bind: [JSON.stringify(currentSchedules), timeTable.id],
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    }

    // Tự động cập nhật lịch cắt cơm sau khi thêm (chỉ sử dụng SQL)
    try {
      const autoCutRiceService = require("../services/autoCutRiceService");
      const cutRiceSchedule =
        await autoCutRiceService.generateCutRiceScheduleSQL(student.id);
      await autoCutRiceService.updateAutoCutRiceWithSchedule(
        student.id,
        cutRiceSchedule
      );
    } catch (autoCutError) {
      console.error("Error updating auto cut rice:", autoCutError);
      // Không throw error để không ảnh hưởng đến việc tạo lịch học
    }

    return res.status(201).json({
      ...timeTable.toJSON(),
      message: "Thêm lịch học thành công và đã cập nhật lịch cắt cơm tự động",
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteTimeTable = async (req, res) => {
  try {
    const { userId, scheduleId } = req.params;

    const user = await User.findByPk(userId, {
      include: [{ model: Student }],
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const student = user.student;

    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const timeTable = await TimeTable.findOne({
      where: { studentId: student.id },
    });
    if (!timeTable) {
      return res.status(404).json({ message: "TimeTable không tồn tại" });
    }

    // Tìm schedule cụ thể trong mảng schedules bằng id
    const currentSchedules = timeTable.schedules || [];
    const scheduleIndex = currentSchedules.findIndex(
      (schedule) => schedule.id === scheduleId
    );
    if (scheduleIndex === -1) {
      return res.status(404).json({ message: "Schedule không tồn tại" });
    }

    // Xóa schedule tại vị trí tìm được
    currentSchedules.splice(scheduleIndex, 1);

    // Sử dụng raw SQL để cập nhật JSONB field
    const { sequelize } = require("../services/sequelize");
    await sequelize.query(
      "UPDATE time_tables SET schedules = $1 WHERE id = $2",
      {
        bind: [JSON.stringify(currentSchedules), timeTable.id],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    // Tự động cập nhật lịch cắt cơm sau khi xóa (chỉ sử dụng SQL)
    try {
      const autoCutRiceService = require("../services/autoCutRiceService");
      const cutRiceSchedule =
        await autoCutRiceService.generateCutRiceScheduleSQL(student.id);
      await autoCutRiceService.updateAutoCutRiceWithSchedule(
        student.id,
        cutRiceSchedule
      );
    } catch (autoCutError) {
      console.error("Error updating auto cut rice:", autoCutError);
      // Không throw error để không ảnh hưởng đến việc xóa lịch học
    }

    return res.status(200).json({
      message:
        "Lịch học đã được xóa thành công và đã cập nhật lịch cắt cơm tự động",
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const updateTimeTable = async (req, res) => {
  try {
    const { userId, scheduleId } = req.params;

    // Tự động cập nhật trường time từ startTime và endTime
    const updateData = { ...req.body };
    if (updateData.startTime && updateData.endTime) {
      updateData.time = `${updateData.startTime} - ${updateData.endTime}`;
    }

    // Tìm user và student
    const user = await User.findByPk(userId, {
      include: [{ model: Student }],
    });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const student = user.student;
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Tìm timeTable của student
    const timeTable = await TimeTable.findOne({
      where: { studentId: student.id },
    });

    if (!timeTable) {
      return res.status(404).json({ message: "TimeTable không tồn tại" });
    }

    // Tìm schedule cụ thể trong mảng schedules bằng id
    const currentSchedules = timeTable.schedules || [];
    const scheduleIndex = currentSchedules.findIndex(
      (schedule) => schedule.id === scheduleId
    );

    if (scheduleIndex === -1) {
      return res.status(404).json({ message: "Schedule không tồn tại" });
    }

    // Cập nhật schedule tại vị trí tìm được
    currentSchedules[scheduleIndex] = {
      ...currentSchedules[scheduleIndex],
      ...updateData,
    };

    // Sử dụng raw SQL để cập nhật JSONB field
    const { sequelize } = require("../services/sequelize");
    await sequelize.query(
      "UPDATE time_tables SET schedules = $1 WHERE id = $2",
      {
        bind: [JSON.stringify(currentSchedules), timeTable.id],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    // Tự động cập nhật lịch cắt cơm (chỉ sử dụng SQL)
    try {
      const autoCutRiceService = require("../services/autoCutRiceService");
      const cutRiceSchedule =
        await autoCutRiceService.generateCutRiceScheduleSQL(student.id);
      await autoCutRiceService.updateAutoCutRiceWithSchedule(
        student.id,
        cutRiceSchedule
      );
    } catch (autoCutError) {
      console.error("Error updating auto cut rice:", autoCutError);
      // Không throw error để không ảnh hưởng đến việc cập nhật lịch học
    }

    return res.status(200).json({
      timeTable: currentSchedules[scheduleIndex],
      message:
        "Cập nhật lịch học thành công và đã cập nhật lịch cắt cơm tự động",
    });
  } catch (error) {
    console.error("Error in updateTimeTable:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getTimeTable,
  createTimeTable,
  deleteTimeTable,
  updateTimeTable,
};

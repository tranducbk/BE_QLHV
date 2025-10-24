const { TimeTable, User, Student } = require("../models");

const getTimeTable = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Lấy lịch học từ model time_table
    const timeTable = await TimeTable.findOne({
      where: { studentId: studentId },
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
    const { studentId } = req.params;
    const scheduleData = req.body;

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
      where: { studentId: studentId },
    });

    if (!timeTable) {
      // Tạo mới timeTable cho sinh viên
      timeTable = await TimeTable.create({
        studentId: studentId,
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
        await autoCutRiceService.generateCutRiceScheduleSQL(studentId);
      await autoCutRiceService.updateAutoCutRiceWithSchedule(
        studentId,
        cutRiceSchedule
      );
    } catch (autoCutError) {
      console.error("Error updating auto cut rice:", autoCutError);
      // Không throw error để không ảnh hưởng đến việc tạo lịch học
    }

    // Trả về schedule vừa tạo để frontend có thể update state ngay lập tức
    return res.status(201).json({
      schedule: scheduleData, // Thêm schedule vừa tạo với ID
      message: "Thêm lịch học thành công và đã cập nhật lịch cắt cơm tự động",
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteTimeTable = async (req, res) => {
  try {
    const { studentId, scheduleId } = req.params;
    console.log("DEBUG - deleteTimeTable - studentId:", studentId);
    console.log("DEBUG - deleteTimeTable - scheduleId:", scheduleId);

    const timeTable = await TimeTable.findOne({
      where: { studentId: studentId },
    });

    if (!timeTable) {
      console.log("DEBUG - TimeTable not found for studentId:", studentId);
      return res.status(404).json({ message: "TimeTable không tồn tại" });
    }

    console.log("DEBUG - TimeTable found:", timeTable.id);
    console.log("DEBUG - Current schedules:", timeTable.schedules);

    // Tìm schedule cụ thể trong mảng schedules bằng id
    const currentSchedules = timeTable.schedules || [];
    const scheduleIndex = currentSchedules.findIndex(
      (schedule) => schedule.id === scheduleId
    );

    console.log("DEBUG - Schedule index found:", scheduleIndex);

    if (scheduleIndex === -1) {
      console.log("DEBUG - Schedule not found with id:", scheduleId);
      return res.status(404).json({ message: "Schedule không tồn tại" });
    }

    // Xóa schedule tại vị trí tìm được
    currentSchedules.splice(scheduleIndex, 1);
    console.log("DEBUG - Schedules after splice:", currentSchedules);

    // Sử dụng raw SQL để cập nhật JSONB field
    const { sequelize } = require("../services/sequelize");
    await sequelize.query(
      "UPDATE time_tables SET schedules = $1 WHERE id = $2",
      {
        bind: [JSON.stringify(currentSchedules), timeTable.id],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    console.log("DEBUG - SQL update completed");

    // Tự động cập nhật lịch cắt cơm sau khi xóa (chỉ sử dụng SQL)
    try {
      const autoCutRiceService = require("../services/autoCutRiceService");
      const cutRiceSchedule =
        await autoCutRiceService.generateCutRiceScheduleSQL(studentId);
      await autoCutRiceService.updateAutoCutRiceWithSchedule(
        studentId,
        cutRiceSchedule
      );
      console.log("DEBUG - Auto cut rice updated successfully");
    } catch (autoCutError) {
      console.error("Error updating auto cut rice:", autoCutError);
      // Không throw error để không ảnh hưởng đến việc xóa lịch học
    }

    return res.status(200).json({
      message:
        "Lịch học đã được xóa thành công và đã cập nhật lịch cắt cơm tự động",
    });
  } catch (error) {
    console.error("DEBUG - deleteTimeTable error:", error);
    console.error("DEBUG - Error stack:", error.stack);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const updateTimeTable = async (req, res) => {
  try {
    const { studentId, scheduleId } = req.params;

    // Tự động cập nhật trường time từ startTime và endTime
    const updateData = { ...req.body };
    if (updateData.startTime && updateData.endTime) {
      updateData.time = `${updateData.startTime} - ${updateData.endTime}`;
    }

    // Tìm timeTable của student
    const timeTable = await TimeTable.findOne({
      where: { studentId: studentId },
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
        await autoCutRiceService.generateCutRiceScheduleSQL(studentId);
      await autoCutRiceService.updateAutoCutRiceWithSchedule(
        studentId,
        cutRiceSchedule
      );
    } catch (autoCutError) {
      console.error("Error updating auto cut rice:", autoCutError);
      // Không throw error để không ảnh hưởng đến việc cập nhật lịch học
    }

    // Trả về schedule đã cập nhật để frontend có thể update state
    return res.status(200).json({
      schedule: currentSchedules[scheduleIndex], // Đổi từ timeTable thành schedule để consistency
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

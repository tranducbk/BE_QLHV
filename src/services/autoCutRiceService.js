const { Student, University, TimeTable, Organization } = require("../models");
const timeHelper = require("../helpers/timeHelper");

// Các thời gian cố định cho bữa ăn
const MEAL_TIMES = {
  BREAKFAST: "06:00",
  LUNCH: "11:00",
  DINNER: "17:30",
};

// Tính toán thời gian cần đi trước khi bắt đầu học
const calculateDepartureTime = (startTime, travelTime) => {
  return timeHelper.calculateTravelTime(startTime, travelTime);
};

// Tính toán thời gian về sau khi kết thúc học
const calculateReturnTime = (endTime, travelTime) => {
  return timeHelper.calculateReturnTime(endTime, travelTime);
};

// Kiểm tra xem có cần cắt cơm không
const shouldCutMeal = (departureTime, returnTime, mealTime) => {
  return timeHelper.shouldCutMeal(departureTime, returnTime, mealTime);
};

// Kiểm tra xem có cần cắt cơm dựa trên thời gian học
const shouldCutMealByClassTime = (startTime, endTime, travelTime, mealTime) => {
  // Tính thời gian đi trước khi học
  const departureTime = calculateDepartureTime(startTime, travelTime);
  // Tính thời gian về sau khi học
  const returnTime = calculateReturnTime(endTime, travelTime);

  // Kiểm tra xem bữa ăn có bị ảnh hưởng không
  return shouldCutMeal(departureTime, returnTime, mealTime);
};

// Xác định loại bữa ăn dựa trên thời gian
const getMealType = (timeString) => {
  const timeMinutes = timeHelper.timeToMinutes(timeString);
  const breakfastMinutes = timeHelper.timeToMinutes(MEAL_TIMES.BREAKFAST);
  const lunchMinutes = timeHelper.timeToMinutes(MEAL_TIMES.LUNCH);
  const dinnerMinutes = timeHelper.timeToMinutes(MEAL_TIMES.DINNER);

  if (timeMinutes <= breakfastMinutes + 60) return "breakfast";
  if (timeMinutes <= lunchMinutes + 60) return "lunch";
  if (timeMinutes <= dinnerMinutes + 60) return "dinner";
  return null;
};

// Tạo lịch cắt cơm tự động
const generateAutoCutRiceSchedule = async (studentId) => {
  try {
    console.log(
      `[DEBUG] Starting generateAutoCutRiceSchedule for student: ${studentId}`
    );
    const student = await Student.findByPk(studentId, {
      include: [University, Organization],
    });
    if (!student) {
      throw new Error("Không tìm thấy sinh viên");
    }

    // Lấy thông tin organization từ student
    const organization = student.organization;

    // Sử dụng travelTime từ organization, nếu không có thì dùng mặc định
    const travelTime = organization?.travelTime || 45; // Mặc định 45 phút

    // Lấy lịch học của sinh viên từ model time_table mới
    const timeTable = await TimeTable.findOne({
      where: { studentId: studentId },
    });
    const schedules = timeTable?.schedules || [];

    // Khởi tạo lịch cắt cơm cho tuần
    const cutRiceSchedule = {
      monday: { breakfast: false, lunch: false, dinner: false },
      tuesday: { breakfast: false, lunch: false, dinner: false },
      wednesday: { breakfast: false, lunch: false, dinner: false },
      thursday: { breakfast: false, lunch: false, dinner: false },
      friday: { breakfast: false, lunch: false, dinner: false },
      saturday: { breakfast: false, lunch: false, dinner: false },
      sunday: { breakfast: false, lunch: false, dinner: false },
    };

    // Xử lý từng môn học (logic chính xác)
    // Nhóm lịch học theo ngày
    const timeTableByDay = {};
    schedules.forEach((schedule) => {
      const day = schedule.day;
      if (!timeTableByDay[day]) {
        timeTableByDay[day] = [];
      }
      timeTableByDay[day].push(schedule);
    });

    // Xử lý từng ngày
    Object.entries(timeTableByDay).forEach(([day, daySchedules]) => {
      console.log(
        `[DEBUG] Processing day: ${day} with ${daySchedules.length} schedules`
      );

      // Mapping ngày từ tiếng Việt sang tiếng Anh
      const dayMapping = {
        "Thứ 2": "monday",
        "Thứ 3": "tuesday",
        "Thứ 4": "wednesday",
        "Thứ 5": "thursday",
        "Thứ 6": "friday",
        "Thứ 7": "saturday",
        "Chủ nhật": "sunday",
      };

      const englishDay = dayMapping[day];
      if (!englishDay) {
        console.warn(`Không tìm thấy mapping cho ngày: ${day}`);
        return;
      }

      // Tìm thời gian sớm nhất và muộn nhất trong ngày
      let earliestStartTime = null;
      let latestEndTime = null;

      // Sắp xếp lịch học theo thời gian bắt đầu
      daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));

      // Tạo các khoảng thời gian liên tục
      const timeRanges = [];
      let currentRange = {
        start: daySchedules[0].startTime,
        end: daySchedules[0].endTime,
      };

      for (let i = 1; i < daySchedules.length; i++) {
        const currentSchedule = daySchedules[i];
        const timeBetweenClasses = timeHelper.getTimeDifference(
          currentRange.end,
          currentSchedule.startTime
        );
        const maxGap = travelTime * 2; // 2 lần thời gian đi lại

        console.log(
          `[DEBUG] Gap between classes: ${timeBetweenClasses} minutes, max gap: ${maxGap} minutes`
        );

        if (timeBetweenClasses > maxGap) {
          // Tách khoảng thời gian
          timeRanges.push(currentRange);
          currentRange = {
            start: currentSchedule.startTime,
            end: currentSchedule.endTime,
          };
          console.log(
            `[DEBUG] Split time range: ${currentRange.start} - ${currentRange.end}`
          );
        } else {
          // Mở rộng khoảng thời gian hiện tại
          currentRange.end = currentSchedule.endTime;
          console.log(
            `[DEBUG] Extended time range: ${currentRange.start} - ${currentRange.end}`
          );
        }
      }

      // Thêm khoảng cuối cùng
      timeRanges.push(currentRange);

      console.log(
        `[DEBUG] Day ${day} has ${timeRanges.length} time ranges:`,
        timeRanges
      );

      // Xử lý từng khoảng thời gian
      timeRanges.forEach((range, index) => {
        console.log(
          `[DEBUG] Processing range ${index + 1}: ${range.start} - ${range.end}`
        );

        // Tính khoảng thời gian đi lại cho khoảng này
        const departureTime = calculateDepartureTime(range.start, travelTime);
        const returnTime = calculateReturnTime(range.end, travelTime);

        console.log(
          `[DEBUG] Range ${
            index + 1
          } travel range: ${departureTime} - ${returnTime}`
        );

        // Kiểm tra từng bữa ăn
        const meals = [
          { type: "breakfast", time: MEAL_TIMES.BREAKFAST },
          { type: "lunch", time: MEAL_TIMES.LUNCH },
          { type: "dinner", time: MEAL_TIMES.DINNER },
        ];

        meals.forEach((meal) => {
          if (
            shouldCutMeal(
              departureTime,
              returnTime,
              meal.time,
              range.start,
              range.end
            )
          ) {
            console.log(
              `[DEBUG] Setting ${meal.type} to true for ${englishDay} (range ${
                index + 1
              })`
            );
            cutRiceSchedule[englishDay][meal.type] = true;
          }
        });
      });
    });

    return cutRiceSchedule;
  } catch (error) {
    console.error("Error generating auto cut rice schedule:", error);
    throw error;
  }
};

// Cập nhật lịch cắt cơm tự động cho sinh viên
const updateAutoCutRice = async (studentId) => {
  try {
    const cutRiceSchedule = await generateAutoCutRiceSchedule(studentId);

    // Cập nhật vào database - sử dụng CutRice model SQL
    const { CutRice } = require("../models");

    // Tìm lịch cắt cơm hiện có
    let existingCutRice = await CutRice.findOne({
      where: { studentId: studentId },
      order: [["createdAt", "DESC"]],
    });

    if (existingCutRice) {
      // Cập nhật lịch hiện có
      await existingCutRice.update({
        monday: cutRiceSchedule.monday,
        tuesday: cutRiceSchedule.tuesday,
        wednesday: cutRiceSchedule.wednesday,
        thursday: cutRiceSchedule.thursday,
        friday: cutRiceSchedule.friday,
        saturday: cutRiceSchedule.saturday,
        sunday: cutRiceSchedule.sunday,
        isAutoGenerated: true, // Đánh dấu là tự động
        lastUpdated: new Date(),
        notes: "Tự động tạo dựa trên lịch học",
      });
    } else {
      // Tạo lịch mới
      await CutRice.create({
        studentId: studentId,
        ...cutRiceSchedule,
        isAutoGenerated: true, // Đánh dấu là tự động
        lastUpdated: new Date(),
        notes: "Tự động tạo dựa trên lịch học",
      });
    }
    return cutRiceSchedule;
  } catch (error) {
    console.error("Error updating auto cut rice:", error);
    throw error;
  }
};

// Reset về lịch cắt cơm tự động
const resetToAutoCutRice = async (studentId) => {
  try {
    const cutRiceSchedule = await generateAutoCutRiceSchedule(studentId);

    // Cập nhật vào database - sử dụng CutRice model SQL
    const { CutRice } = require("../models");

    // Tìm lịch cắt cơm hiện có
    let existingCutRice = await CutRice.findOne({
      where: { studentId: studentId },
      order: [["createdAt", "DESC"]],
    });

    if (existingCutRice) {
      // Reset về lịch tự động
      await existingCutRice.update({
        monday: cutRiceSchedule.monday,
        tuesday: cutRiceSchedule.tuesday,
        wednesday: cutRiceSchedule.wednesday,
        thursday: cutRiceSchedule.thursday,
        friday: cutRiceSchedule.friday,
        saturday: cutRiceSchedule.saturday,
        sunday: cutRiceSchedule.sunday,
        isAutoGenerated: true, // Đánh dấu là tự động
        lastUpdated: new Date(),
        notes: "Đã reset về lịch tự động",
      });
    } else {
      // Tạo lịch mới nếu chưa có
      await CutRice.create({
        studentId: studentId,
        ...cutRiceSchedule,
        isAutoGenerated: true, // Đánh dấu là tự động
        lastUpdated: new Date(),
        notes: "Đã reset về lịch tự động",
      });
    }
    return cutRiceSchedule;
  } catch (error) {
    console.error("Error resetting auto cut rice:", error);
    throw error;
  }
};

// Tính toán thời gian đi lại tối ưu
const calculateOptimalTravelTime = (universityAddress, studentAddress) => {
  // Có thể tích hợp với Google Maps API hoặc các service khác
  // Hiện tại trả về thời gian mặc định
  return 45; // 45 phút
};

// Kiểm tra xem có cần cập nhật lịch cắt cơm không
const shouldUpdateCutRice = (lastUpdated) => {
  if (!lastUpdated) return true;

  const now = new Date();
  const diffInHours = (now - lastUpdated) / (1000 * 60 * 60);

  // Cập nhật nếu đã quá 24 giờ
  return diffInHours > 24;
};

module.exports = {
  generateAutoCutRiceSchedule,
  updateAutoCutRice,
  resetToAutoCutRice,
  calculateOptimalTravelTime,
  shouldUpdateCutRice,
  MEAL_TIMES,
  calculateDepartureTime,
  calculateReturnTime,
  shouldCutMeal,
  getMealType,
};

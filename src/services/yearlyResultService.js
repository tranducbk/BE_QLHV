const {
  Student,
  SemesterResult,
  YearlyResult,
  SubjectResult,
} = require("../models");

/**
 * Cập nhật yearlyResults khi có semesterResult mới
 * @param {string} studentId - ID của học viên
 * @param {string} schoolYear - Năm học
 */
const updateYearlyResults = async (studentId, schoolYear) => {
  try {
    // Lấy tất cả semesterResults của năm học này từ SQL
    const semesterResults = await SemesterResult.findAll({
      where: {
        studentId: studentId,
        schoolYear: schoolYear,
      },
      include: [SubjectResult],
      order: [["semester", "ASC"]],
    });

    if (semesterResults.length === 0) {
      throw new Error("Không có kết quả học kỳ nào cho năm học này");
    }

    // Tính toán thống kê tổng hợp theo năm
    const totalCredits = semesterResults.reduce(
      (sum, result) => sum + (result.totalCredits || 0),
      0
    );

    const totalGrade4 = semesterResults.reduce(
      (sum, result) =>
        sum + (result.averageGrade4 || 0) * (result.totalCredits || 0),
      0
    );

    const totalGrade10 = semesterResults.reduce(
      (sum, result) =>
        sum + (result.averageGrade10 || 0) * (result.totalCredits || 0),
      0
    );

    const averageGrade4 = totalCredits > 0 ? totalGrade4 / totalCredits : 0;
    const averageGrade10 = totalCredits > 0 ? totalGrade10 / totalCredits : 0;

    // Lấy kết quả cuối cùng để tính cumulative
    const lastSemester = semesterResults[semesterResults.length - 1];
    const cumulativeCredits = lastSemester.cumulativeCredits || 0;
    const cumulativeGrade4 = lastSemester.cumulativeGrade4 || 0;
    const cumulativeGrade10 = lastSemester.cumulativeGrade10 || 0;

    // Tính thống kê môn học từ SubjectResult
    const allSubjects = semesterResults.flatMap(
      (result) => result.subject_results || []
    );
    const totalSubjects = allSubjects.length;
    const passedSubjects = allSubjects.filter(
      (subject) => subject.letterGrade && subject.letterGrade !== "F"
    ).length;
    const failedSubjects = totalSubjects - passedSubjects;

    // Xác định trạng thái học tập
    let academicStatus = "Trung bình";
    if (averageGrade10 >= 8.0) academicStatus = "Tốt";
    else if (averageGrade10 >= 7.0) academicStatus = "Khá";
    else if (averageGrade10 >= 5.0) academicStatus = "Trung bình";
    else if (averageGrade10 >= 4.0) academicStatus = "Yếu";
    else academicStatus = "Kém";

    // Tạo hoặc cập nhật yearlyResult trong SQL
    const yearlyResultData = {
      studentId: studentId,
      schoolYear,
      totalCredits,
      averageGrade4: Math.round(averageGrade4 * 100) / 100,
      averageGrade10: Math.round(averageGrade10 * 100) / 100,
      cumulativeCredits,
      cumulativeGrade4: Math.round(cumulativeGrade4 * 100) / 100,
      cumulativeGrade10: Math.round(cumulativeGrade10 * 100) / 100,
      totalSubjects,
      passedSubjects,
      failedSubjects,
      academicStatus,
      // Lấy xếp loại từ học kỳ cuối cùng
      partyRating: lastSemester.partyRating || {},
      trainingRating: lastSemester.trainingRating || "",
    };

    // Tìm và cập nhật hoặc tạo mới yearlyResult
    const [yearlyResult, created] = await YearlyResult.findOrCreate({
      where: {
        studentId: studentId,
        schoolYear: schoolYear,
      },
      defaults: yearlyResultData,
    });

    if (!created) {
      // Cập nhật yearlyResult hiện có
      await yearlyResult.update(yearlyResultData);
    }

      `Đã cập nhật yearlyResults cho học viên ${studentId}, năm học ${schoolYear}`
    );

    return yearlyResult;
  } catch (error) {
    console.error("Lỗi khi cập nhật yearlyResults:", error);
    throw error;
  }
};

/**
 * Lấy yearlyResults của một học viên
 * @param {string} studentId - ID của học viên
 * @param {string} schoolYear - Năm học (optional)
 */
const getYearlyResults = async (studentId, schoolYear = null) => {
  try {
    const whereClause = { studentId: studentId };
    if (schoolYear) {
      whereClause.schoolYear = schoolYear;
    }

    const yearlyResults = await YearlyResult.findAll({
      where: whereClause,
      order: [["schoolYear", "DESC"]],
    });

    if (schoolYear && yearlyResults.length === 0) {
      return null;
    }

    return schoolYear ? yearlyResults[0] : yearlyResults;
  } catch (error) {
    console.error("Lỗi khi lấy yearlyResults:", error);
    throw error;
  }
};

/**
 * Lấy thống kê tổng hợp theo năm học
 * @param {string} schoolYear - Năm học
 */
const getYearlyStatistics = async (schoolYear) => {
  try {
    const yearlyResults = await YearlyResult.findAll({
      where: { schoolYear: schoolYear },
    });

    if (yearlyResults.length === 0) {
      return {
        totalStudents: 0,
        averageGrade4: 0,
        averageGrade10: 0,
        academicStatusDistribution: {},
        partyRatingDistribution: {},
        trainingRatingDistribution: {},
      };
    }

    // Tính thống kê tổng hợp
    const totalStudents = yearlyResults.length;
    const totalGrade4 = yearlyResults.reduce(
      (sum, yearly) => sum + (yearly.averageGrade4 || 0),
      0
    );
    const totalGrade10 = yearlyResults.reduce(
      (sum, yearly) => sum + (yearly.averageGrade10 || 0),
      0
    );
    const averageGrade4 = Math.round((totalGrade4 / totalStudents) * 100) / 100;
    const averageGrade10 =
      Math.round((totalGrade10 / totalStudents) * 100) / 100;

    // Phân bố trạng thái học tập
    const academicStatusDistribution = yearlyResults.reduce((acc, yearly) => {
      const status = yearly.academicStatus || "Chưa có";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Phân bố xếp loại Đảng viên
    const partyRatingDistribution = yearlyResults.reduce((acc, yearly) => {
      const rating = yearly.partyRating?.rating || "Chưa có";
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    // Phân bố xếp loại rèn luyện
    const trainingRatingDistribution = yearlyResults.reduce((acc, yearly) => {
      const rating = yearly.trainingRating || "Chưa có";
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    return {
      totalStudents,
      averageGrade4,
      averageGrade10,
      academicStatusDistribution,
      partyRatingDistribution,
      trainingRatingDistribution,
    };
  } catch (error) {
    console.error("Lỗi khi lấy thống kê theo năm:", error);
    throw error;
  }
};

module.exports = {
  updateYearlyResults,
  getYearlyResults,
  getYearlyStatistics,
};

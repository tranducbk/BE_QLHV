const { Op } = require("sequelize");
const {
  User,
  Student,
  SemesterResult,
  SubjectResult,
  YearlyResult,
  Notification,
  GradeProposal,
  ProposalSubjectResult,
} = require("../models");
const gradeHelper = require("../helpers/gradeHelper");
const {
  NOTIFICATION_TYPES,
  TARGET_ROLES,
  NOTIFICATION_TEMPLATES,
} = require("../helpers/notificationHelper");

/**
 * @swagger
 * components:
 *   schemas:
 *     SemesterResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Semester result ID
 *         studentId:
 *           type: string
 *           description: Student ID
 *         semester:
 *           type: string
 *           description: Semester name
 *         schoolYear:
 *           type: string
 *           description: School year
 *         gpa:
 *           type: number
 *           description: GPA
 *         totalCredits:
 *           type: integer
 *           description: Total credits
 *         passedCredits:
 *           type: integer
 *           description: Passed credits
 *         failedCredits:
 *           type: integer
 *           description: Failed credits
 *     SubjectResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Subject result ID
 *         semesterResultId:
 *           type: string
 *           description: Semester result ID
 *         subjectName:
 *           type: string
 *           description: Subject name
 *         credits:
 *           type: integer
 *           description: Credits
 *         grade:
 *           type: string
 *           description: Grade
 *         gpa:
 *           type: number
 *           description: GPA
 *     YearlyResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Yearly result ID
 *         studentId:
 *           type: string
 *           description: Student ID
 *         year:
 *           type: integer
 *           description: Year
 *         yearlyGPA:
 *           type: number
 *           description: Yearly GPA
 *         cumulativeGPA:
 *           type: number
 *           description: Cumulative GPA
 *         totalCredits:
 *           type: integer
 *           description: Total credits
 *         passedCredits:
 *           type: integer
 *           description: Passed credits
 */

/**
 * @swagger
 * /grade/student/{userId}:
 *   get:
 *     summary: Lấy kết quả học tập của sinh viên
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Kết quả học tập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 semesterResults:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SemesterResult'
 *                 yearlyResults:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/YearlyResult'
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */
const getStudentGrades = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user || !user.studentId) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const student = await Student.findByPk(user.studentId);
    const semesterRows = await SemesterResult.findAll({
      where: { studentId: user.studentId },
      order: [
        ["schoolYear", "ASC"],
        ["semester", "ASC"],
      ],
    });
    const semesterIds = semesterRows.map((r) => r.id);
    const subjects = await SubjectResult.findAll({
      where: { semesterResultId: semesterIds },
    });
    const subjectsBySemesterId = subjects.reduce((acc, s) => {
      if (!acc[s.semesterResultId]) acc[s.semesterResultId] = [];
      acc[s.semesterResultId].push({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        credits: s.credits,
        letterGrade: s.letterGrade,
        gradePoint4: s.gradePoint4,
        gradePoint10: s.gradePoint10,
      });
      return acc;
    }, {});

    // semester_results chỉ chứa dữ liệu đã được duyệt (không có trường status)
    const semesterResults = semesterRows.map((r) => ({
      id: r.id,
      semester: r.semester,
      schoolYear: r.schoolYear,
      subjects: subjectsBySemesterId[r.id] || [],
      totalCredits: r.totalCredits,
      averageGrade4: r.averageGrade4,
      averageGrade10: r.averageGrade10,
      cumulativeCredits: r.cumulativeCredits,
      cumulativeGrade4: r.cumulativeGrade4,
      cumulativeGrade10: r.cumulativeGrade10,
      debtCredits: r.debtCredits,
      failedSubjects: r.failedSubjects,
      yearlyResultId: r.yearlyResultId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    // Tất cả records trong semester_results đều đã được duyệt
    const approvedResults = semesterResults;
    const cumulativeGrade4 =
      gradeHelper.calculateCumulativeGrade4(approvedResults);
    const cumulativeGrade10 =
      gradeHelper.calculateCumulativeGrade10(approvedResults);

    const cumulativeGrade10FromCpa4 = (() => {
      if (cumulativeGrade4 < 2.0) return 0.0;
      if (cumulativeGrade4 < 2.5)
        return Math.min(10.0, 3.0 * cumulativeGrade4 - 0.5);
      if (cumulativeGrade4 < 3.2)
        return Math.min(10.0, 1.42 * cumulativeGrade4 + 3.45);
      return Math.min(10.0, 2.5 * cumulativeGrade4 + 0.0);
    })();

    // Lấy yearlyResults và format partyRating
    const yearlyResultsRaw = await YearlyResult.findAll({
      where: { studentId: user.studentId },
      order: [["schoolYear", "ASC"]],
    });

    const yearlyResults = yearlyResultsRaw.map((yr) => ({
      id: yr.id,
      studentId: yr.studentId,
      schoolYear: yr.schoolYear,
      averageGrade4: yr.averageGrade4,
      averageGrade10: yr.averageGrade10,
      cumulativeCredits: yr.cumulativeCredits,
      cumulativeGrade4: yr.cumulativeGrade4,
      cumulativeGrade10: yr.cumulativeGrade10,
      debtCredits: yr.debtCredits,
      failedSubjects: yr.failedSubjects,
      totalSubjects: yr.totalSubjects,
      passedSubjects: yr.passedSubjects,
      academicStatus: yr.academicStatus,
      studentLevel: yr.studentLevel,
      semesterIds: yr.semesterIds,
      trainingRating: yr.trainingRating || null,
      // Format partyRating thành object với rating và decisionNumber
      partyRating: yr.partyRating
        ? {
            rating: yr.partyRating,
            decisionNumber: yr.partyRatingDecisionNumber || "",
          }
        : null,
      createdAt: yr.createdAt,
      updatedAt: yr.updatedAt,
    }));

    return res.status(200).json({
      studentId: student.studentId,
      fullName: student.fullName,
      positionParty: student.positionParty,
      semesterResults,
      yearlyResults,
      summary: {
        totalSemesters: semesterResults.length,
        totalCredits: gradeHelper.calculateCumulativeCredits(semesterResults),
        cumulativeGrade4,
        cumulativeGrade10,
        cumulativeGrade10FromCpa4,
      },
    });
  } catch (error) {
    console.error("Error getting student grades:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy kết quả học tập theo học kỳ
const getSemesterGrades = async (req, res) => {
  try {
    const { userId, semester, schoolYear } = req.params;

    const user = await User.findByPk(userId);
    if (!user || !user.studentId) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const formattedSemester = gradeHelper.formatSemester(semester);
    const row = await SemesterResult.findOne({
      where: {
        studentId: user.studentId,
        semester: formattedSemester,
        schoolYear,
      },
    });

    if (!row) {
      return res.status(404).json({
        message: `Không tìm thấy kết quả học tập cho học kỳ ${semester} năm ${schoolYear}`,
      });
    }

    const subj = await SubjectResult.findAll({
      where: { semesterResultId: row.id },
    });
    const targetSemester = {
      id: row.id,
      semester: row.semester,
      schoolYear: row.schoolYear,
      subjects: subj.map((s) => ({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        credits: s.credits,
        letterGrade: s.letterGrade,
        gradePoint4: s.gradePoint4,
        gradePoint10: s.gradePoint10,
      })),
      totalCredits: row.totalCredits,
      averageGrade4: row.averageGrade4,
      averageGrade10: row.averageGrade10,
      cumulativeCredits: row.cumulativeCredits,
      cumulativeGrade4: row.cumulativeGrade4,
      cumulativeGrade10: row.cumulativeGrade10,
      debtCredits: row.debtCredits,
      failedSubjects: row.failedSubjects,
      yearlyResultId: row.yearlyResultId,
    };

    gradeHelper.updateSemesterResult(targetSemester);

    return res.status(200).json(targetSemester);
  } catch (error) {
    console.error("Error getting semester grades:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy kết quả học tập theo học kỳ cho admin (sử dụng studentId)
const getSemesterGradesByStudentId = async (req, res) => {
  try {
    const { studentId, semester, schoolYear } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const formattedSemester = gradeHelper.formatSemester(semester);
    const row = await SemesterResult.findOne({
      where: {
        studentId,
        semester: formattedSemester,
        schoolYear,
        // Không cần filter status vì semester_results chỉ chứa dữ liệu đã được duyệt
      },
    });
    if (!row) {
      return res.status(404).json({
        message: `Không tìm thấy kết quả học tập cho học kỳ ${semester} năm ${schoolYear}`,
      });
    }
    const subj = await SubjectResult.findAll({
      where: { semesterResultId: row.id },
    });
    const targetSemester = {
      id: row.id,
      semester: row.semester,
      schoolYear: row.schoolYear,
      subjects: subj.map((s) => ({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        credits: s.credits,
        letterGrade: s.letterGrade,
        gradePoint4: s.gradePoint4,
        gradePoint10: s.gradePoint10,
      })),
      totalCredits: row.totalCredits,
      averageGrade4: row.averageGrade4,
      averageGrade10: row.averageGrade10,
      cumulativeCredits: row.cumulativeCredits,
      cumulativeGrade4: row.cumulativeGrade4,
      cumulativeGrade10: row.cumulativeGrade10,
      debtCredits: row.debtCredits,
      failedSubjects: row.failedSubjects,
      yearlyResultId: row.yearlyResultId,
    };
    gradeHelper.updateSemesterResult(targetSemester);
    return res.status(200).json(targetSemester);
  } catch (error) {
    console.error("Error getting semester grades by studentId:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm kết quả học tập cho học kỳ
const addSemesterGrades = async (req, res) => {
  try {
    const { userId } = req.params;
    const { semester, schoolYear, subjects } = req.body;

    const user = await User.findByPk(userId);
    if (!user || !user.studentId) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Validate dữ liệu
    if (!semester || !schoolYear || !subjects || !Array.isArray(subjects)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    // Đảm bảo semester là string format "HK1", "HK2", "HK3"
    const formattedSemester = gradeHelper.formatSemester(semester);

    // Kiểm tra học kỳ đã tồn tại chưa (xử lý cả dữ liệu cũ)
    const existingSemester = await SemesterResult.findOne({
      where: {
        studentId: user.studentId,
        semester: formattedSemester,
        schoolYear,
      },
    });

    if (existingSemester) {
      return res.status(400).json({
        message: `Kết quả học tập cho học kỳ ${semester} năm ${schoolYear} đã tồn tại`,
      });
    }

    // Validate tất cả môn học trước
    for (const subject of subjects) {
      const grade10 = parseFloat(subject.gradePoint10);
      if (isNaN(grade10) || grade10 < 0 || grade10 > 10) {
        return res.status(400).json({
          message: `Điểm hệ 10 của môn "${
            subject.subjectName || subject.subjectCode
          }" phải từ 0 đến 10`,
        });
      }
      const credits = parseInt(subject.credits);
      if (isNaN(credits) || credits <= 0) {
        return res.status(400).json({
          message: `Số tín chỉ của môn "${
            subject.subjectName || subject.subjectCode
          }" không hợp lệ`,
        });
      }
    }

    // Tạo kết quả môn học từ dữ liệu đầu vào
    const processedSubjects = subjects.map((subject) => {
      const { subjectCode, subjectName } = subject;
      const credits = parseInt(subject.credits);
      const gradePoint10 = parseFloat(subject.gradePoint10);

      // Tính điểm chữ từ điểm hệ 10
      const letterGrade = gradeHelper.grade10ToLetter(gradePoint10);

      // Tính điểm hệ 4 từ điểm chữ
      const gradePoint4 = gradeHelper.letterToGrade4(letterGrade);

      return {
        subjectCode: subjectCode || "",
        subjectName: subjectName || "",
        credits,
        letterGrade,
        gradePoint4,
        gradePoint10,
      };
    });

    // Tạo SemesterResult + SubjectResult (SQL)
    // Lưu ý: API này đã deprecated, nên sử dụng GradeProposal workflow thay thế
    const sr = await SemesterResult.create({
      studentId: user.studentId,
      semester: formattedSemester,
      schoolYear,
      totalCredits: gradeHelper.calculateTotalCredits(processedSubjects),
      averageGrade4: gradeHelper.calculateAverageGrade4(processedSubjects),
      averageGrade10: gradeHelper.calculateAverageGrade10(processedSubjects),
      debtCredits: gradeHelper.calculateDebtCredits(processedSubjects),
      failedSubjects: gradeHelper.calculateFailedSubjects(processedSubjects),
      cumulativeCredits: 0,
      cumulativeGrade4: 0,
      cumulativeGrade10: 0,
    });
    if (processedSubjects.length) {
      await SubjectResult.bulkCreate(
        processedSubjects.map((s) => ({ ...s, semesterResultId: sr.id }))
      );
    }

    // KHÔNG tính lại CPA vì kết quả đang chờ duyệt
    // CPA sẽ được tính lại khi admin phê duyệt

    // Lấy lại semester result với subjects để trả về frontend
    const createdSemester = await SemesterResult.findByPk(sr.id);
    const createdSubjects = await SubjectResult.findAll({
      where: { semesterResultId: sr.id },
    });

    return res.status(201).json({
      message: "Thêm kết quả học tập thành công. Đang chờ admin phê duyệt.",
      semesterResult: {
        ...createdSemester.toJSON(),
        subjects: createdSubjects.map((s) => ({
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          credits: s.credits,
          letterGrade: s.letterGrade,
          gradePoint4: s.gradePoint4,
          gradePoint10: s.gradePoint10,
        })),
      },
    });
  } catch (error) {
    console.error("Error adding semester grades:", error);
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
};

// Lấy kết quả học tập theo học kỳ
const updateSemesterGrades = async (req, res) => {
  try {
    const { userId, semester, schoolYear } = req.params;
    const { subjects } = req.body;

    const user = await User.findByPk(userId);
    if (!user || !user.studentId) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Đảm bảo semester là string format "HK1", "HK2", "HK3"
    const formattedSemester = gradeHelper.formatSemester(semester);

    // Tìm học kỳ cần cập nhật (xử lý cả dữ liệu cũ)
    const sr = await SemesterResult.findOne({
      where: {
        studentId: user.studentId,
        semester: formattedSemester,
        schoolYear,
      },
    });
    if (!sr) {
      return res.status(404).json({
        message: `Không tìm thấy kết quả học tập cho học kỳ ${semester} năm ${schoolYear}`,
      });
    }

    // Validate tất cả môn học trước
    for (const subject of subjects) {
      const grade10 = parseFloat(subject.gradePoint10);
      if (isNaN(grade10) || grade10 < 0 || grade10 > 10) {
        return res.status(400).json({
          message: `Điểm hệ 10 của môn "${
            subject.subjectName || subject.subjectCode
          }" phải từ 0 đến 10`,
        });
      }
      const credits = parseInt(subject.credits);
      if (isNaN(credits) || credits <= 0) {
        return res.status(400).json({
          message: `Số tín chỉ của môn "${
            subject.subjectName || subject.subjectCode
          }" không hợp lệ`,
        });
      }
    }

    // Xử lý dữ liệu môn học
    const processedSubjects = subjects.map((subject) => {
      const { subjectCode, subjectName } = subject;
      const credits = parseInt(subject.credits);
      const gradePoint10 = parseFloat(subject.gradePoint10);

      // Tính điểm chữ từ điểm hệ 10
      const letterGrade = gradeHelper.grade10ToLetter(gradePoint10);

      // Tính điểm hệ 4 từ điểm chữ
      const gradePoint4 = gradeHelper.letterToGrade4(letterGrade);

      return {
        subjectCode: subjectCode || "",
        subjectName: subjectName || "",
        credits,
        letterGrade,
        gradePoint4,
        gradePoint10,
      };
    });

    // Nếu kết quả đã được duyệt, đặt lại thành pending khi cập nhật
    // Lưu ý: API này đã deprecated, nên sử dụng GradeProposal workflow thay thế
    await SubjectResult.destroy({ where: { semesterResultId: sr.id } });
    if (processedSubjects.length) {
      await SubjectResult.bulkCreate(
        processedSubjects.map((s) => ({ ...s, semesterResultId: sr.id }))
      );
    }
    await sr.update({
      totalCredits: gradeHelper.calculateTotalCredits(processedSubjects),
      averageGrade4: gradeHelper.calculateAverageGrade4(processedSubjects),
      averageGrade10: gradeHelper.calculateAverageGrade10(processedSubjects),
      debtCredits: gradeHelper.calculateDebtCredits(processedSubjects),
      failedSubjects: gradeHelper.calculateFailedSubjects(processedSubjects),
    });

    // Tính lại CPA sau khi cập nhật
    await recalculateAllYearlyResultsSql(user.studentId);

    // Lấy lại semester result với subjects để trả về frontend
    const updatedSemester = await SemesterResult.findByPk(sr.id);
    const updatedSubjects = await SubjectResult.findAll({
      where: { semesterResultId: sr.id },
    });

    return res.status(200).json({
      message:
        "Cập nhật kết quả học tập thành công. Đang chờ admin phê duyệt lại.",
      semesterResult: {
        ...updatedSemester.toJSON(),
        subjects: updatedSubjects.map((s) => ({
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          credits: s.credits,
          letterGrade: s.letterGrade,
          gradePoint4: s.gradePoint4,
          gradePoint10: s.gradePoint10,
        })),
      },
    });
  } catch (error) {
    console.error("Error updating semester grades:", error);
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
};

// Xóa kết quả học tập cho học kỳ
const deleteSemesterGrades = async (req, res) => {
  try {
    const { userId, semester, schoolYear } = req.params;

    const user = await User.findByPk(userId);
    if (!user || !user.studentId) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const formattedSemester = gradeHelper.formatSemester(semester);
    const sr = await SemesterResult.findOne({
      where: {
        studentId: user.studentId,
        semester: formattedSemester,
        schoolYear,
      },
    });
    if (!sr) {
      return res.status(404).json({
        message: `Không tìm thấy kết quả học tập cho học kỳ ${semester} năm ${schoolYear}`,
      });
    }
    await SubjectResult.destroy({ where: { semesterResultId: sr.id } });
    await SemesterResult.destroy({ where: { id: sr.id } });
    await recalculateAllYearlyResultsSql(user.studentId);

    return res.status(200).json({ message: "Xóa kết quả học tập thành công" });
  } catch (error) {
    console.error("Error deleting semester grades:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa kết quả học tập theo ID (để tương thích với frontend cũ)
const deleteSemesterGradesById = async (req, res) => {
  try {
    const { userId, learnId } = req.params;

    const user = await User.findByPk(userId);
    if (!user || !user.studentId) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const sr = await SemesterResult.findOne({
      where: { id: learnId, studentId: user.studentId },
    });
    if (!sr) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy kết quả học tập" });
    }

    await SubjectResult.destroy({ where: { semesterResultId: sr.id } });
    await SemesterResult.destroy({ where: { id: sr.id } });
    await recalculateAllYearlyResultsSql(user.studentId);

    return res.status(200).json({ message: "Xóa kết quả học tập thành công" });
  } catch (error) {
    console.error("Error deleting semester grades by ID:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Tính toán lại CPA cho tất cả các năm học của sinh viên
const recalculateAllYearlyResultsAPI = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user || !user.studentId) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    await recalculateAllYearlyResultsSql(user.studentId);
    const results = await YearlyResult.findAll({
      where: { studentId: user.studentId },
      order: [["schoolYear", "ASC"]],
    });

    return res.status(200).json({
      message: "Đã tính toán lại CPA cho tất cả các năm học thành công",
      yearlyResults: results,
    });
  } catch (error) {
    console.error("Error recalculating all yearly results:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy thông tin điểm
const getGradeInfo = async (req, res) => {
  try {
    const { letterGrade } = req.params;

    const gradeInfo = gradeHelper.getGradeInfo(letterGrade);

    if (!gradeInfo) {
      return res.status(400).json({ message: "Điểm chữ không hợp lệ" });
    }

    return res.status(200).json(gradeInfo);
  } catch (error) {
    console.error("Error getting grade info:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Chuyển đổi điểm
const convertGrade = async (req, res) => {
  try {
    const { fromType, toType, value } = req.body;

    if (!fromType || !toType || value === undefined) {
      return res.status(400).json({ message: "Thiếu thông tin chuyển đổi" });
    }

    let result = null;

    switch (fromType) {
      case "letter":
        if (toType === "grade4") {
          result = gradeHelper.letterToGrade4(value);
        } else if (toType === "grade10") {
          result = gradeHelper.letterToGrade10(value);
        }
        break;
      case "grade4":
        if (toType === "letter") {
          result = gradeHelper.grade4ToLetter(parseFloat(value));
        } else if (toType === "grade10") {
          result = gradeHelper.grade4ToGrade10(parseFloat(value));
        }
        break;
      case "grade10":
        if (toType === "letter") {
          result = gradeHelper.grade10ToLetter(parseFloat(value));
        } else if (toType === "grade4") {
          result = gradeHelper.grade10ToGrade4(parseFloat(value));
        }
        break;
      default:
        return res.status(400).json({ message: "Loại điểm không hợp lệ" });
    }

    if (result === null) {
      return res.status(400).json({ message: "Không thể chuyển đổi điểm" });
    }

    return res.status(200).json({
      fromType,
      toType,
      fromValue: value,
      toValue: result,
    });
  } catch (error) {
    console.error("Error converting grade:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Tính điểm trung bình
const calculateAverage = async (req, res) => {
  try {
    const { grades, gradeType } = req.body;

    if (!grades || !Array.isArray(grades) || !gradeType) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    let average = 0;

    if (gradeType === "grade4") {
      average = gradeHelper.calculateAverageFromGrade4(grades);
    } else if (gradeType === "grade10") {
      average = gradeHelper.calculateAverageFromGrade10(grades);
    } else {
      return res.status(400).json({ message: "Loại điểm không hợp lệ" });
    }

    return res.status(200).json({
      grades,
      gradeType,
      average: average.toFixed(2),
    });
  } catch (error) {
    console.error("Error calculating average:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// SQL: Tính toán lại CPA và YearlyResult từ dữ liệu SemesterResult/SubjectResult
// semester_results chỉ chứa dữ liệu đã được duyệt
const recalculateAllYearlyResultsSql = async (studentId) => {
  const semesters = await SemesterResult.findAll({
    where: {
      studentId,
      // Không cần filter status vì semester_results chỉ chứa dữ liệu đã được duyệt
    },
    order: [
      ["schoolYear", "ASC"],
      ["semester", "ASC"],
    ],
  });
  if (!semesters.length) {
    // Xóa tất cả YearlyResult nếu không còn semester nào
    await YearlyResult.destroy({ where: { studentId } });
    return;
  }
  const subj = await SubjectResult.findAll({
    where: { semesterResultId: semesters.map((s) => s.id) },
  });
  const subjMap = subj.reduce((acc, s) => {
    if (!acc[s.semesterResultId]) acc[s.semesterResultId] = [];
    acc[s.semesterResultId].push({
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      credits: s.credits,
      letterGrade: s.letterGrade,
      gradePoint4: s.gradePoint4,
      gradePoint10: s.gradePoint10,
    });
    return acc;
  }, {});

  // Chuẩn bị dữ liệu semester với subjects
  const semestersWithSubjects = semesters.map((r) => ({
    id: r.id,
    semester: r.semester,
    schoolYear: r.schoolYear,
    subjects: subjMap[r.id] || [],
    totalCredits:
      r.totalCredits || gradeHelper.calculateTotalCredits(subjMap[r.id] || []),
    averageGrade4:
      r.averageGrade4 ||
      gradeHelper.calculateAverageGrade4(subjMap[r.id] || []),
    averageGrade10:
      r.averageGrade10 ||
      gradeHelper.calculateAverageGrade10(subjMap[r.id] || []),
  }));

  // Tính CPA tích lũy cho TẤT CẢ các học kỳ theo thứ tự thời gian
  let cumulativeTotalCredits = 0;
  let cumulativeTotalGradePoints4 = 0;
  let cumulativeTotalGradePoints10 = 0;

  for (const semesterData of semestersWithSubjects) {
    const subjects = semesterData.subjects || [];

    // Tính CPA tích lũy từ TỪNG MÔN HỌC (không phải từ GPA học kỳ)
    subjects.forEach((subject) => {
      const credits = subject.credits || 0;
      const gradePoint4 = subject.gradePoint4 || 0;
      const gradePoint10 = subject.gradePoint10 || 0;

      cumulativeTotalCredits += credits;
      cumulativeTotalGradePoints4 += gradePoint4 * credits;
      cumulativeTotalGradePoints10 += gradePoint10 * credits;
    });

    const cumulativeGrade4 =
      cumulativeTotalCredits > 0
        ? parseFloat(
            (cumulativeTotalGradePoints4 / cumulativeTotalCredits).toFixed(2)
          )
        : 0.0;
    const cumulativeGrade10 =
      cumulativeTotalCredits > 0
        ? parseFloat(
            (cumulativeTotalGradePoints10 / cumulativeTotalCredits).toFixed(2)
          )
        : 0.0;
    const studentLevel = gradeHelper.calculateStudentLevel(
      cumulativeTotalCredits
    );

    // Cập nhật CPA vào từng SemesterResult
    await SemesterResult.update(
      {
        cumulativeCredits: cumulativeTotalCredits,
        cumulativeGrade4: cumulativeGrade4,
        cumulativeGrade10: cumulativeGrade10,
        studentLevel: studentLevel,
      },
      { where: { id: semesterData.id } }
    );
  }

  // Nhóm theo năm học và tính YearlyResult
  const semestersByYear = {};
  semestersWithSubjects.forEach((r) => {
    if (!semestersByYear[r.schoolYear]) semestersByYear[r.schoolYear] = [];
    semestersByYear[r.schoolYear].push(r);
  });

  // Tính và upsert YearlyResult theo từng năm
  const validYears = Object.keys(semestersByYear).sort();
  let yearCumulativeCredits = 0;
  let yearCumulativeGradePoints4 = 0;
  let yearCumulativeGradePoints10 = 0;

  for (const schoolYear of validYears) {
    const yearSemesters = semestersByYear[schoolYear];
    const semesterIds = yearSemesters.map((s) => s.id);

    // Tính GPA năm học từ TỪNG MÔN HỌC của năm đó
    const allSubjects = yearSemesters.flatMap((r) => r.subjects || []);
    let yearlyTotalCredits = 0;
    let yearlyTotalGradePoints4 = 0;
    let yearlyTotalGradePoints10 = 0;

    allSubjects.forEach((subject) => {
      const credits = subject.credits || 0;
      const gradePoint4 = subject.gradePoint4 || 0;
      const gradePoint10 = subject.gradePoint10 || 0;

      yearlyTotalCredits += credits;
      yearlyTotalGradePoints4 += gradePoint4 * credits;
      yearlyTotalGradePoints10 += gradePoint10 * credits;
    });

    const yearlyGPA =
      yearlyTotalCredits > 0 ? yearlyTotalGradePoints4 / yearlyTotalCredits : 0;
    const yearlyGrade10 =
      yearlyTotalCredits > 0
        ? yearlyTotalGradePoints10 / yearlyTotalCredits
        : 0;

    // Cập nhật CPA tích lũy cho năm học
    yearCumulativeCredits += yearlyTotalCredits;
    yearCumulativeGradePoints4 += yearlyTotalGradePoints4;
    yearCumulativeGradePoints10 += yearlyTotalGradePoints10;

    const cumulativeGPA =
      yearCumulativeCredits > 0
        ? yearCumulativeGradePoints4 / yearCumulativeCredits
        : 0;
    const cumulativeGrade10 =
      yearCumulativeCredits > 0
        ? yearCumulativeGradePoints10 / yearCumulativeCredits
        : 0;

    const totalSubjects = allSubjects.length;
    const passedSubjects = allSubjects.filter(
      (s) => s.letterGrade && s.letterGrade !== "F"
    ).length;
    const failedSubjects = totalSubjects - passedSubjects;
    const yearDebtCredits = allSubjects.reduce((sum, s) => {
      const c = s.credits || 0;
      const isDebt = s.letterGrade === "F" || s.gradePoint4 === 0;
      return sum + (isDebt ? c : 0);
    }, 0);

    let academicStatus = "Trung bình";
    if (yearlyGrade10 >= 8.0) academicStatus = "Tốt";
    else if (yearlyGrade10 >= 7.0) academicStatus = "Khá";
    else if (yearlyGrade10 >= 5.0) academicStatus = "Trung bình";
    else if (yearlyGrade10 >= 4.0) academicStatus = "Yếu";
    else academicStatus = "Kém";

    const studentLevel = gradeHelper.calculateStudentLevel(
      yearCumulativeCredits
    );

    const [yr, created] = await YearlyResult.findOrCreate({
      where: { studentId, schoolYear },
      defaults: {
        studentId,
        schoolYear,
        averageGrade4: parseFloat(yearlyGPA.toFixed(2)),
        averageGrade10: parseFloat(yearlyGrade10.toFixed(2)),
        cumulativeGrade4: parseFloat(cumulativeGPA.toFixed(2)),
        cumulativeGrade10: parseFloat(cumulativeGrade10.toFixed(2)),
        cumulativeCredits: yearCumulativeCredits,
        totalCredits: yearlyTotalCredits,
        totalSubjects,
        passedSubjects,
        failedSubjects,
        debtCredits: yearDebtCredits,
        academicStatus,
        studentLevel: studentLevel,
        semesterIds,
      },
    });
    if (!created) {
      await yr.update({
        averageGrade4: parseFloat(yearlyGPA.toFixed(2)),
        averageGrade10: parseFloat(yearlyGrade10.toFixed(2)),
        cumulativeGrade4: parseFloat(cumulativeGPA.toFixed(2)),
        cumulativeGrade10: parseFloat(cumulativeGrade10.toFixed(2)),
        cumulativeCredits: yearCumulativeCredits,
        totalCredits: yearlyTotalCredits,
        totalSubjects,
        passedSubjects,
        failedSubjects,
        debtCredits: yearDebtCredits,
        academicStatus,
        studentLevel: studentLevel,
        semesterIds,
      });
    }
    await SemesterResult.update(
      { yearlyResultId: yr.id },
      { where: { id: semesterIds } }
    );
  }

  // Xóa YearlyResult thừa
  await YearlyResult.destroy({
    where: { studentId, schoolYear: { [Op.notIn]: validYears } },
  });
};

// Function tự động cập nhật kết quả năm học với mối quan hệ ID
const updateYearlyResults = async (student, schoolYear) => {
  try {
    // Lấy tất cả kết quả học kỳ của năm học được chọn
    const semesterResults = student.semesterResults || [];
    const yearResults = semesterResults.filter(
      (result) => result.schoolYear === schoolYear
    );

    if (yearResults.length === 0) {
      return;
    }

    // Tính toán GPA trung bình của năm học
    let totalCredits = 0;
    let totalGradePoints = 0;
    let totalGradePoints10 = 0;

    // Thu thập ID của các học kỳ thuộc năm học này
    const semesterIds = yearResults.map((result) => result.id);

    yearResults.forEach((result, index) => {
      if (result.subjects && result.subjects.length > 0) {
        result.subjects.forEach((subject, subIndex) => {
          const credits = subject.credits || 0;
          const gradePoint4 = subject.gradePoint4 || 0;
          const gradePoint10 = subject.gradePoint10 || 0;

          totalCredits += credits;
          totalGradePoints += credits * gradePoint4;
          totalGradePoints10 += credits * gradePoint10;
        });
      }
    });

    const yearlyGPA =
      totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : "0.00";
    const yearlyGrade10 =
      totalCredits > 0
        ? (totalGradePoints10 / totalCredits).toFixed(2)
        : "0.00";

    // Tính toán CPA tích lũy (lấy từ kết quả cuối cùng của năm học)
    const lastResult = yearResults[yearResults.length - 1];
    const cumulativeGPA = lastResult.cumulativeGrade4?.toFixed(2) || "0.00";
    const cumulativeGrade10 =
      lastResult.cumulativeGrade10?.toFixed(2) || "0.00";
    const cumulativeCredits = lastResult.cumulativeCredits || 0;
    const totalDebt = lastResult.totalDebt || 0;
    const studentLevel = lastResult.studentLevel || 1;

    // Tính thống kê môn học
    const allSubjects = yearResults.flatMap((result) => result.subjects || []);
    const totalSubjects = allSubjects.length;
    const passedSubjects = allSubjects.filter(
      (subject) => subject.letterGrade && subject.letterGrade !== "F"
    ).length;
    const failedSubjects = totalSubjects - passedSubjects;

    // Xác định trạng thái học tập
    let academicStatus = "Trung bình";
    if (parseFloat(yearlyGrade10) >= 8.0) academicStatus = "Tốt";
    else if (parseFloat(yearlyGrade10) >= 7.0) academicStatus = "Khá";
    else if (parseFloat(yearlyGrade10) >= 5.0) academicStatus = "Trung bình";
    else if (parseFloat(yearlyGrade10) >= 4.0) academicStatus = "Yếu";
    else academicStatus = "Kém";

    // Tạo hoặc cập nhật kết quả năm học với danh sách ID học kỳ
    const yearlyResult = {
      schoolYear: schoolYear,
      averageGrade4: parseFloat(yearlyGPA),
      averageGrade10: parseFloat(yearlyGrade10),
      cumulativeGrade4: parseFloat(cumulativeGPA),
      cumulativeGrade10: parseFloat(cumulativeGrade10),
      cumulativeCredits: cumulativeCredits,
      totalCredits: totalCredits,
      totalSubjects: totalSubjects,
      passedSubjects: passedSubjects,
      failedSubjects: failedSubjects,
      academicStatus: academicStatus,
      semesterCount: yearResults.length,
      semesterIds: semesterIds, // Lưu danh sách ID của các học kỳ
      updatedAt: new Date(),
    };

    // Kiểm tra xem đã có kết quả năm học chưa
    if (!student.yearlyResults) {
      student.yearlyResults = [];
    }

    const existingYearlyIndex = student.yearlyResults.findIndex(
      (result) => result.schoolYear === schoolYear
    );

    if (existingYearlyIndex !== -1) {
      // Cập nhật kết quả năm học hiện có
      student.yearlyResults[existingYearlyIndex] = {
        ...student.yearlyResults[existingYearlyIndex],
        ...yearlyResult,
      };
    } else {
      // Thêm kết quả năm học mới
      student.yearlyResults.push({
        ...yearlyResult,
        createdAt: new Date(),
      });
    }

    // Lưu vào database trước để có id
    await student.update(student.toJSON());

    // Sau khi lưu, cập nhật thông tin năm học cho tất cả học kỳ thuộc năm này
    const savedYearlyResult = student.yearlyResults.find(
      (result) => result.schoolYear === schoolYear
    );

    if (savedYearlyResult) {
      yearResults.forEach((semester) => {
        semester.yearlyResultId = savedYearlyResult.id;
      });

      // Lưu lại để cập nhật yearlyResultId
      await student.update(student.toJSON());
    }
  } catch (error) {
    console.error("Error updating yearly results:", error);
    throw error;
  }
};

// Function helper để cập nhật kết quả năm học sau khi xóa học kỳ
const updateYearlyResultsAfterDelete = async (student, schoolYear) => {
  try {
    // Kiểm tra xem còn học kỳ nào trong năm học không
    const remainingSemesters = student.semesterResults.filter(
      (result) => result.schoolYear === schoolYear
    );

    if (remainingSemesters.length === 0) {
      // Nếu không còn học kỳ nào, xóa kết quả năm học
      if (student.yearlyResults) {
        const yearlyIndex = student.yearlyResults.findIndex(
          (result) => result.schoolYear === schoolYear
        );
        if (yearlyIndex !== -1) {
          student.yearlyResults.splice(yearlyIndex, 1);
        }
      }
    } else {
      // Nếu còn học kỳ, cập nhật lại kết quả năm học
      await updateYearlyResults(student, schoolYear);
    }
  } catch (error) {
    console.error("Error updating yearly results after delete:", error);
  }
};

// Function để xóa năm học và tất cả học kỳ thuộc năm đó
const deleteYearlyResult = async (req, res) => {
  try {
    const { userId, schoolYear } = req.params;

    const user = await User.findByPk(userId, {
      include: [{ model: Student }],
    });
    if (!user || !user.student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Tìm kết quả năm học
    if (!user.student.yearlyResults) {
      return res.status(404).json({
        message: `Không có kết quả năm học nào cho năm ${schoolYear}`,
      });
    }

    const yearlyIndex = user.student.yearlyResults.findIndex(
      (result) => result.schoolYear === schoolYear
    );

    if (yearlyIndex === -1) {
      return res.status(404).json({
        message: `Không tìm thấy kết quả năm học cho năm ${schoolYear}`,
      });
    }

    const yearlyResult = user.student.yearlyResults[yearlyIndex];
    // Xóa tất cả học kỳ thuộc năm học này bằng cách gọi API xóa học kỳ
    if (yearlyResult.semesterIds && yearlyResult.semesterIds.length > 0) {
      const semesterIdsToDelete = yearlyResult.semesterIds;

      // Tìm thông tin học kỳ để gọi API xóa
      const semestersToDelete = user.student.semesterResults.filter(
        (semester) => semesterIdsToDelete.includes(semester.id)
      );

      // Gọi API xóa từng học kỳ
      for (const semester of semestersToDelete) {
        try {
          // Tìm index của học kỳ trong semesterResults
          const semesterIndex = user.student.semesterResults.findIndex(
            (result) => result.id === semester.id
          );

          if (semesterIndex !== -1) {
            // Xóa học kỳ khỏi semesterResults
            user.student.semesterResults.splice(semesterIndex, 1);
          }
        } catch (semesterError) {
          console.error(
            `Lỗi khi xóa học kỳ ${semester.semester}:`,
            semesterError
          );
        }
      }
    }

    // Xóa kết quả năm học
    user.student.yearlyResults.splice(yearlyIndex, 1);

    // Cập nhật điểm tích lũy cho các học kỳ còn lại
    if (user.student.semesterResults.length > 0) {
      gradeHelper.updateCumulativeGrades(user.student.semesterResults);
    }

    // Lưu vào database
    await user.student.update(user.student.toJSON());

    return res.status(200).json({
      message: `Đã xóa thành công năm học ${schoolYear} và tất cả học kỳ thuộc năm đó`,
      deletedSemesterCount: yearlyResult.semesterIds?.length || 0,
    });
  } catch (error) {
    console.error("Error deleting yearly result:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Function helper để xóa ID học kỳ khỏi danh sách semesterIds trong năm học
const removeSemesterIdFromYearlyResult = (student, semesterId, schoolYear) => {
  try {
    if (!student.yearlyResults) return;

    const yearlyIndex = student.yearlyResults.findIndex(
      (result) => result.schoolYear === schoolYear
    );

    if (yearlyIndex !== -1) {
      const yearlyResult = student.yearlyResults[yearlyIndex];
      if (yearlyResult.semesterIds) {
        yearlyResult.semesterIds = yearlyResult.semesterIds.filter(
          (id) => id.toString() !== semesterId.toString()
        );
        yearlyResult.semesterCount = yearlyResult.semesterIds.length;
      }
    }
  } catch (error) {
    console.error("Error removing semester ID from yearly result:", error);
  }
};

// Helper function để tính toán lại CPA cho tất cả các năm học
const recalculateAllYearlyResults = async (student) => {
  if (!student.semesterResults || student.semesterResults.length === 0) {
    return;
  }

  // Sắp xếp tất cả học kỳ theo thứ tự thời gian
  const allSortedSemesters = student.semesterResults.sort((a, b) => {
    const yearComparison = a.schoolYear.localeCompare(b.schoolYear);
    if (yearComparison !== 0) return yearComparison;
    const semesterA = parseInt(a.semester.replace("HK", ""));
    const semesterB = parseInt(b.semester.replace("HK", ""));
    return semesterA - semesterB;
  });

  // Nhóm học kỳ theo năm học
  const semestersByYear = {};
  allSortedSemesters.forEach((semester) => {
    if (!semestersByYear[semester.schoolYear]) {
      semestersByYear[semester.schoolYear] = [];
    }
    semestersByYear[semester.schoolYear].push(semester);
  });

  // Tính toán CPA tích lũy dần dần
  let cumulativeTotalCredits = 0;
  let cumulativeTotalGradePoints4 = 0;
  let cumulativeTotalGradePoints10 = 0;

  // Xử lý từng năm học theo thứ tự thời gian
  const sortedYears = Object.keys(semestersByYear).sort();

  for (const schoolYear of sortedYears) {
    const yearSemesters = semestersByYear[schoolYear];

    // Tính GPA năm học từ TỪNG MÔN HỌC (không phải từ GPA học kỳ)
    let yearlyTotalCredits = 0;
    let yearlyTotalGradePoints4 = 0;
    let yearlyTotalGradePoints10 = 0;
    const semesterIds = [];
    const allSubjects = [];

    yearSemesters.forEach((semester) => {
      semesterIds.push(semester.id);

      // Cập nhật nợ cho từng học kỳ trong quá trình duyệt
      const subjects = semester.subjects || [];
      semester.debtCredits = gradeHelper.calculateDebtCredits(subjects);
      semester.failedSubjects = gradeHelper.calculateFailedSubjects(subjects);

      // Thu thập tất cả môn học của năm
      allSubjects.push(...subjects);
    });

    // Tính GPA năm học từ TỪNG MÔN HỌC
    allSubjects.forEach((subject) => {
      const credits = subject.credits || 0;
      const gradePoint4 = subject.gradePoint4 || 0;
      const gradePoint10 = subject.gradePoint10 || 0;

      yearlyTotalCredits += credits;
      yearlyTotalGradePoints4 += gradePoint4 * credits;
      yearlyTotalGradePoints10 += gradePoint10 * credits;
    });

    // Cập nhật CPA tích lũy cho năm học này
    cumulativeTotalCredits += yearlyTotalCredits;
    cumulativeTotalGradePoints4 += yearlyTotalGradePoints4;
    cumulativeTotalGradePoints10 += yearlyTotalGradePoints10;

    const yearlyGPA =
      yearlyTotalCredits > 0
        ? (yearlyTotalGradePoints4 / yearlyTotalCredits).toFixed(2)
        : "0.00";
    const yearlyGrade10 =
      yearlyTotalCredits > 0
        ? (yearlyTotalGradePoints10 / yearlyTotalCredits).toFixed(2)
        : "0.00";
    const cumulativeGPA =
      cumulativeTotalCredits > 0
        ? (cumulativeTotalGradePoints4 / cumulativeTotalCredits).toFixed(2)
        : "0.00";
    const cumulativeGrade10 =
      cumulativeTotalCredits > 0
        ? (cumulativeTotalGradePoints10 / cumulativeTotalCredits).toFixed(2)
        : "0.00";

    // Tính thống kê môn học cho năm (đã tính ở trên trong biến allSubjects)
    const totalSubjects = allSubjects.length;
    const passedSubjects = allSubjects.filter(
      (subject) => subject.letterGrade && subject.letterGrade !== "F"
    ).length;
    const failedSubjects = totalSubjects - passedSubjects;

    // Tín chỉ nợ theo năm
    const yearDebtCredits = allSubjects.reduce((sum, s) => {
      const c = s.credits || 0;
      const isDebt = s.letterGrade === "F" || s.gradePoint4 === 0;
      return sum + (isDebt ? c : 0);
    }, 0);

    // Xác định trạng thái học tập (chỉ dựa trên GPA năm học)
    let academicStatus = "Trung bình";
    if (yearlyGrade10 >= 8.0) academicStatus = "Tốt";
    else if (yearlyGrade10 >= 7.0) academicStatus = "Khá";
    else if (yearlyGrade10 >= 5.0) academicStatus = "Trung bình";
    else if (yearlyGrade10 >= 4.0) academicStatus = "Yếu";
    else academicStatus = "Kém";

    // Tạo hoặc cập nhật yearlyResult
    const yearlyResult = {
      schoolYear: schoolYear,
      semesters: yearSemesters, // Lưu toàn bộ dữ liệu học kỳ trong năm
      averageGrade4: parseFloat(yearlyGPA),
      averageGrade10: parseFloat(yearlyGrade10),
      cumulativeGrade4: parseFloat(cumulativeGPA),
      cumulativeGrade10: parseFloat(cumulativeGrade10),
      cumulativeCredits: cumulativeTotalCredits,
      totalCredits: yearlyTotalCredits,
      totalSubjects: totalSubjects,
      passedSubjects: passedSubjects,
      failedSubjects: failedSubjects,
      debtCredits: yearDebtCredits,
      academicStatus: academicStatus,
      semesterCount: yearSemesters.length,
      semesterIds: semesterIds, // Vẫn giữ lại để tương thích
      updatedAt: new Date(),
    };

    // Cập nhật hoặc tạo mới yearlyResult
    if (!student.yearlyResults) {
      student.yearlyResults = [];
    }

    const existingYearlyIndex = student.yearlyResults.findIndex(
      (result) => result.schoolYear === schoolYear
    );

    if (existingYearlyIndex !== -1) {
      student.yearlyResults[existingYearlyIndex] = {
        ...student.yearlyResults[existingYearlyIndex],
        ...yearlyResult,
      };
    } else {
      student.yearlyResults.push({
        ...yearlyResult,
        createdAt: new Date(),
      });
    }

    // Cập nhật yearlyResultId cho các học kỳ
    const savedYearlyResult = student.yearlyResults.find(
      (result) => result.schoolYear === schoolYear
    );

    if (savedYearlyResult) {
      yearSemesters.forEach((semester) => {
        semester.yearlyResultId = savedYearlyResult.id;
      });
    }
  }

  // Xóa các yearlyResult không còn tồn tại
  const existingYears = student.yearlyResults.map(
    (result) => result.schoolYear
  );
  const validYears = Object.keys(semestersByYear);

  student.yearlyResults = student.yearlyResults.filter((result) =>
    validYears.includes(result.schoolYear)
  );
};

// Lấy kết quả học tập của sinh viên bằng studentId
const getStudentGradesByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Lấy kết quả đã được duyệt từ semester_results
    const semesterRows = await SemesterResult.findAll({
      where: { studentId },
      order: [
        ["schoolYear", "ASC"],
        ["semester", "ASC"],
      ],
    });
    const semesterIds = semesterRows.map((r) => r.id);
    const subjects = await SubjectResult.findAll({
      where: { semesterResultId: semesterIds },
    });
    const subjectsBySemesterId = subjects.reduce((acc, s) => {
      if (!acc[s.semesterResultId]) acc[s.semesterResultId] = [];
      acc[s.semesterResultId].push({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        credits: s.credits,
        letterGrade: s.letterGrade,
        gradePoint4: s.gradePoint4,
        gradePoint10: s.gradePoint10,
      });
      return acc;
    }, {});

    const semesterResults = semesterRows.map((r) => ({
      id: r.id,
      semester: r.semester,
      schoolYear: r.schoolYear,
      subjects: subjectsBySemesterId[r.id] || [],
      totalCredits: r.totalCredits,
      averageGrade4: r.averageGrade4,
      averageGrade10: r.averageGrade10,
      cumulativeCredits: r.cumulativeCredits,
      cumulativeGrade4: r.cumulativeGrade4,
      cumulativeGrade10: r.cumulativeGrade10,
      debtCredits: r.debtCredits,
      failedSubjects: r.failedSubjects,
      yearlyResultId: r.yearlyResultId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    // Lấy các đề xuất từ grade_proposals
    const proposalRows = await GradeProposal.findAll({
      where: { studentId },
      order: [
        ["schoolYear", "ASC"],
        ["semester", "ASC"],
      ],
    });
    const proposalIds = proposalRows.map((r) => r.id);
    const proposalSubjects = await ProposalSubjectResult.findAll({
      where: { proposalId: proposalIds },
    });
    const subjectsByProposalId = proposalSubjects.reduce((acc, s) => {
      if (!acc[s.proposalId]) acc[s.proposalId] = [];
      acc[s.proposalId].push({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        credits: s.credits,
        letterGrade: s.letterGrade,
        gradePoint4: s.gradePoint4,
        gradePoint10: s.gradePoint10,
      });
      return acc;
    }, {});

    const proposals = proposalRows.map((r) => ({
      id: r.id,
      semester: r.semester,
      schoolYear: r.schoolYear,
      subjects: subjectsByProposalId[r.id] || [],
      totalCredits: r.totalCredits,
      averageGrade4: r.averageGrade4,
      averageGrade10: r.averageGrade10,
      debtCredits: r.debtCredits,
      failedSubjects: r.failedSubjects,
      status: r.status,
      adminNote: r.adminNote,
      approvedBy: r.approvedBy,
      approvedAt: r.approvedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    // Tính CPA từ kết quả đã duyệt
    const cumulativeGrade4 =
      gradeHelper.calculateCumulativeGrade4(semesterResults);
    const cumulativeGrade10 =
      gradeHelper.calculateCumulativeGrade10(semesterResults);

    const cumulativeGrade10FromCpa4 = (() => {
      if (cumulativeGrade4 < 2.0) return 0.0;
      if (cumulativeGrade4 < 2.5)
        return Math.min(10.0, 3.0 * cumulativeGrade4 - 0.5);
      if (cumulativeGrade4 < 3.2)
        return Math.min(10.0, 1.42 * cumulativeGrade4 + 3.45);
      return Math.min(10.0, 2.5 * cumulativeGrade4 + 0.0);
    })();

    // Lấy yearlyResults và format partyRating
    const yearlyResultsRaw = await YearlyResult.findAll({
      where: { studentId },
      order: [["schoolYear", "ASC"]],
    });

    const yearlyResults = yearlyResultsRaw.map((yr) => ({
      id: yr.id,
      studentId: yr.studentId,
      schoolYear: yr.schoolYear,
      averageGrade4: yr.averageGrade4,
      averageGrade10: yr.averageGrade10,
      cumulativeCredits: yr.cumulativeCredits,
      cumulativeGrade4: yr.cumulativeGrade4,
      cumulativeGrade10: yr.cumulativeGrade10,
      debtCredits: yr.debtCredits,
      failedSubjects: yr.failedSubjects,
      totalSubjects: yr.totalSubjects,
      passedSubjects: yr.passedSubjects,
      academicStatus: yr.academicStatus,
      studentLevel: yr.studentLevel,
      semesterIds: yr.semesterIds,
      trainingRating: yr.trainingRating || null,
      partyRating: yr.partyRating
        ? {
            rating: yr.partyRating,
            decisionNumber: yr.partyRatingDecisionNumber || "",
          }
        : null,
      createdAt: yr.createdAt,
      updatedAt: yr.updatedAt,
    }));

    return res.status(200).json({
      studentId: student.studentId,
      fullName: student.fullName,
      positionParty: student.positionParty,
      semesterResults, // Kết quả đã được duyệt
      proposals, // Đề xuất chờ duyệt/đã từ chối
      yearlyResults,
      summary: {
        totalSemesters: semesterResults.length,
        totalCredits: gradeHelper.calculateCumulativeCredits(semesterResults),
        cumulativeGrade4,
        cumulativeGrade10,
        cumulativeGrade10FromCpa4,
      },
    });
  } catch (error) {
    console.error("Error getting student grades by studentId:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm kết quả học tập cho học kỳ bằng studentId
const addSemesterGradesByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, schoolYear, subjects } = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Validate dữ liệu
    if (!semester || !schoolYear || !subjects || !Array.isArray(subjects)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const formattedSemester = gradeHelper.formatSemester(semester);

    // Kiểm tra xem đã có kết quả chính thức cho học kỳ này chưa
    const existingResult = await SemesterResult.findOne({
      where: { studentId, semester: formattedSemester, schoolYear },
    });

    if (existingResult) {
      return res.status(400).json({
        message: `Đã có kết quả học tập chính thức cho học kỳ ${semester} năm ${schoolYear}`,
      });
    }

    // Kiểm tra xem đã có đề xuất PENDING cho học kỳ này chưa
    const existingPendingProposal = await GradeProposal.findOne({
      where: {
        studentId,
        semester: formattedSemester,
        schoolYear,
        status: "PENDING",
      },
    });

    if (existingPendingProposal) {
      return res.status(400).json({
        message: `Đã có đề xuất kết quả học tập cho học kỳ ${semester} năm ${schoolYear} đang chờ phê duyệt.`,
      });
    }

    // Kiểm tra xem đã có đề xuất APPROVED cho học kỳ này chưa
    const existingApprovedProposal = await GradeProposal.findOne({
      where: {
        studentId,
        semester: formattedSemester,
        schoolYear,
        status: "APPROVED",
      },
    });

    if (existingApprovedProposal) {
      return res.status(400).json({
        message: `Đề xuất kết quả học tập cho học kỳ ${semester} năm ${schoolYear} đã được phê duyệt.`,
      });
    }

    // Nếu có đề xuất REJECTED -> vẫn cho tạo mới (giữ lại bản ghi cũ để lưu lịch sử)

    // Validate tất cả môn học trước
    for (const subject of subjects) {
      const grade10 = parseFloat(subject.gradePoint10);
      if (isNaN(grade10) || grade10 < 0 || grade10 > 10) {
        return res.status(400).json({
          message: `Điểm hệ 10 của môn "${
            subject.subjectName || subject.subjectCode
          }" phải từ 0 đến 10`,
        });
      }
      const credits = parseInt(subject.credits);
      if (isNaN(credits) || credits <= 0) {
        return res.status(400).json({
          message: `Số tín chỉ của môn "${
            subject.subjectName || subject.subjectCode
          }" không hợp lệ`,
        });
      }
    }

    // Xử lý dữ liệu môn học
    const processedSubjects = subjects.map((subject) => {
      const { subjectCode, subjectName } = subject;
      const credits = parseInt(subject.credits);
      const gradePoint10 = parseFloat(subject.gradePoint10);

      // Tính điểm chữ từ điểm hệ 10
      const letterGrade = gradeHelper.grade10ToLetter(gradePoint10);

      // Tính điểm hệ 4 từ điểm chữ
      const gradePoint4 = gradeHelper.letterToGrade4(letterGrade);

      return {
        subjectCode: subjectCode || "",
        subjectName: subjectName || "",
        credits,
        letterGrade,
        gradePoint4,
        gradePoint10,
      };
    });

    // Kiểm tra người gọi là admin hay user
    const currentUser = req.user;
    const isAdmin = currentUser?.isAdmin === true;

    if (isAdmin) {
      // Admin thêm kết quả sẽ tự động lưu vào semester_results (đã duyệt)
      const sr = await SemesterResult.create({
        studentId,
        semester: formattedSemester,
        schoolYear,
        totalCredits: gradeHelper.calculateTotalCredits(processedSubjects),
        averageGrade4: gradeHelper.calculateAverageGrade4(processedSubjects),
        averageGrade10: gradeHelper.calculateAverageGrade10(processedSubjects),
        debtCredits: gradeHelper.calculateDebtCredits(processedSubjects),
        failedSubjects: gradeHelper.calculateFailedSubjects(processedSubjects),
        cumulativeCredits: 0,
        cumulativeGrade4: 0,
        cumulativeGrade10: 0,
      });

      if (processedSubjects.length) {
        await SubjectResult.bulkCreate(
          processedSubjects.map((s) => ({ ...s, semesterResultId: sr.id }))
        );
      }

      // Tính lại CPA ngay cho admin
      await recalculateAllYearlyResultsSql(studentId);

      // Lấy lại semester result với subjects để trả về frontend
      const createdSemester = await SemesterResult.findByPk(sr.id);
      const createdSubjects = await SubjectResult.findAll({
        where: { semesterResultId: sr.id },
      });

      return res.status(201).json({
        message: "Thêm kết quả học tập thành công",
        semesterResult: {
          ...createdSemester.toJSON(),
          subjects: createdSubjects.map((s) => ({
            subjectCode: s.subjectCode,
            subjectName: s.subjectName,
            credits: s.credits,
            letterGrade: s.letterGrade,
            gradePoint4: s.gradePoint4,
            gradePoint10: s.gradePoint10,
          })),
        },
      });
    } else {
      // User thêm kết quả = lưu vào bảng grade_proposals (chờ duyệt)
      const proposal = await GradeProposal.create({
        studentId,
        semester: formattedSemester,
        schoolYear,
        totalCredits: gradeHelper.calculateTotalCredits(processedSubjects),
        averageGrade4: gradeHelper.calculateAverageGrade4(processedSubjects),
        averageGrade10: gradeHelper.calculateAverageGrade10(processedSubjects),
        debtCredits: gradeHelper.calculateDebtCredits(processedSubjects),
        failedSubjects: gradeHelper.calculateFailedSubjects(processedSubjects),
        cumulativeCredits: 0,
        cumulativeGrade4: 0,
        cumulativeGrade10: 0,
        status: "PENDING",
      });

      if (processedSubjects.length) {
        await ProposalSubjectResult.bulkCreate(
          processedSubjects.map((s) => ({ ...s, proposalId: proposal.id }))
        );
      }

      // Tạo thông báo cho tất cả admin
      try {
        const admins = await User.findAll({
          where: { isAdmin: true },
        });

        const notificationData = NOTIFICATION_TEMPLATES.gradeProposal(
          student.fullName,
          student.studentId,
          formattedSemester,
          schoolYear
        );

        // Tạo notification cho từng admin
        const notifications = admins.map((admin) => ({
          userId: admin.id,
          targetRole: TARGET_ROLES.ADMIN,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type,
          link: notificationData.link,
          relatedId: proposal.id,
        }));

        if (notifications.length > 0) {
          await Notification.bulkCreate(notifications);
        }
      } catch (notifError) {
        console.error("Error creating notifications for admins:", notifError);
      }

      // Lấy lại proposal với subjects để trả về frontend
      const createdProposal = await GradeProposal.findByPk(proposal.id);
      const createdSubjects = await ProposalSubjectResult.findAll({
        where: { proposalId: proposal.id },
      });

      return res.status(201).json({
        message:
          "Đã gửi đề xuất kết quả học tập. Vui lòng chờ Chỉ huy phê duyệt.",
        proposal: {
          ...createdProposal.toJSON(),
          subjects: createdSubjects.map((s) => ({
            subjectCode: s.subjectCode,
            subjectName: s.subjectName,
            credits: s.credits,
            letterGrade: s.letterGrade,
            gradePoint4: s.gradePoint4,
            gradePoint10: s.gradePoint10,
          })),
        },
      });
    }
  } catch (error) {
    console.error("Error adding semester grades by studentId:", error);
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
};

// User yêu cầu CẬP NHẬT kết quả học tập đã được duyệt (tạo đề xuất UPDATE)
const requestUpdateApprovedGrades = async (req, res) => {
  try {
    const { studentId, semester, schoolYear } = req.params;
    const { subjects } = req.body;
    const jwtUser = req.user;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Kiểm tra quyền
    const dbUser = await User.findByPk(jwtUser.id);
    if (!dbUser || !dbUser.studentId || dbUser.studentId !== student.id) {
      return res.status(403).json({
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    const formattedSemester = gradeHelper.formatSemester(semester);

    // Kiểm tra xem có kết quả chính thức không
    const existingResult = await SemesterResult.findOne({
      where: { studentId, semester: formattedSemester, schoolYear },
    });

    if (!existingResult) {
      return res.status(404).json({
        message: `Không tìm thấy kết quả học tập chính thức cho học kỳ ${semester} năm ${schoolYear} để cập nhật`,
      });
    }

    // Kiểm tra xem đã có đề xuất PENDING cho học kỳ này chưa
    const existingPendingProposal = await GradeProposal.findOne({
      where: { studentId, semester: formattedSemester, schoolYear, status: "PENDING" },
    });

    if (existingPendingProposal) {
      return res.status(400).json({
        message: `Đã có đề xuất cho học kỳ ${semester} năm ${schoolYear} đang chờ phê duyệt.`,
      });
    }

    // Validate môn học
    for (const subject of subjects) {
      const grade10 = parseFloat(subject.gradePoint10);
      if (isNaN(grade10) || grade10 < 0 || grade10 > 10) {
        return res.status(400).json({
          message: `Điểm hệ 10 của môn "${subject.subjectName || subject.subjectCode}" phải từ 0 đến 10`,
        });
      }
      const credits = parseInt(subject.credits);
      if (isNaN(credits) || credits <= 0) {
        return res.status(400).json({
          message: `Số tín chỉ của môn "${subject.subjectName || subject.subjectCode}" không hợp lệ`,
        });
      }
    }

    // Xử lý dữ liệu môn học
    const processedSubjects = subjects.map((subject) => {
      const { subjectCode, subjectName } = subject;
      const credits = parseInt(subject.credits);
      const gradePoint10 = parseFloat(subject.gradePoint10);
      const letterGrade = gradeHelper.grade10ToLetter(gradePoint10);
      const gradePoint4 = gradeHelper.letterToGrade4(letterGrade);

      return {
        subjectCode: subjectCode || "",
        subjectName: subjectName || "",
        credits,
        letterGrade,
        gradePoint4,
        gradePoint10,
      };
    });

    // Tạo đề xuất UPDATE
    const proposal = await GradeProposal.create({
      studentId,
      semester: formattedSemester,
      schoolYear,
      proposalType: "UPDATE", // Loại đề xuất là CẬP NHẬT
      totalCredits: gradeHelper.calculateTotalCredits(processedSubjects),
      averageGrade4: gradeHelper.calculateAverageGrade4(processedSubjects),
      averageGrade10: gradeHelper.calculateAverageGrade10(processedSubjects),
      debtCredits: gradeHelper.calculateDebtCredits(processedSubjects),
      failedSubjects: gradeHelper.calculateFailedSubjects(processedSubjects),
      status: "PENDING",
    });

    // Tạo các môn học trong đề xuất
    if (processedSubjects.length) {
      await ProposalSubjectResult.bulkCreate(
        processedSubjects.map((s) => ({ ...s, proposalId: proposal.id }))
      );
    }

    // Gửi thông báo cho admin
    try {
      const adminUsers = await User.findAll({ where: { isAdmin: true } });
      for (const admin of adminUsers) {
        await Notification.create({
          userId: admin.id,
          studentId: null,
          title: "Yêu cầu cập nhật kết quả học tập",
          content: `Học viên ${student.fullName} (${student.studentId}) yêu cầu cập nhật kết quả ${formattedSemester} năm học ${schoolYear}. Vui lòng xem xét và phê duyệt.`,
          type: "grade_proposal",
          link: "/admin/proposals/grade-results",
          isRead: false,
          targetRole: "ADMIN",
        });
      }
    } catch (notifError) {
      console.error("Error creating notifications for admins:", notifError);
    }

    // Lấy lại proposal với subjects để trả về frontend
    const createdProposal = await GradeProposal.findByPk(proposal.id);
    const createdSubjects = await ProposalSubjectResult.findAll({
      where: { proposalId: proposal.id },
    });

    return res.status(201).json({
      message: "Đã gửi yêu cầu cập nhật kết quả học tập. Vui lòng chờ Chỉ huy phê duyệt.",
      proposal: {
        ...createdProposal.toJSON(),
        subjects: createdSubjects.map((s) => ({
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          credits: s.credits,
          letterGrade: s.letterGrade,
          gradePoint4: s.gradePoint4,
          gradePoint10: s.gradePoint10,
        })),
      },
    });
  } catch (error) {
    console.error("Error requesting update approved grades:", error);
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
};

// User yêu cầu XÓA kết quả học tập đã được duyệt (tạo đề xuất DELETE)
const requestDeleteApprovedGrades = async (req, res) => {
  try {
    const { studentId, semester, schoolYear } = req.params;
    const { reason } = req.body; // Lý do xóa
    const jwtUser = req.user;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Kiểm tra quyền
    const dbUser = await User.findByPk(jwtUser.id);
    if (!dbUser || !dbUser.studentId || dbUser.studentId !== student.id) {
      return res.status(403).json({
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    const formattedSemester = gradeHelper.formatSemester(semester);

    // Kiểm tra xem có kết quả chính thức không
    const existingResult = await SemesterResult.findOne({
      where: { studentId, semester: formattedSemester, schoolYear },
    });

    if (!existingResult) {
      return res.status(404).json({
        message: `Không tìm thấy kết quả học tập chính thức cho học kỳ ${semester} năm ${schoolYear} để xóa`,
      });
    }

    // Kiểm tra xem đã có đề xuất PENDING cho học kỳ này chưa
    const existingPendingProposal = await GradeProposal.findOne({
      where: { studentId, semester: formattedSemester, schoolYear, status: "PENDING" },
    });

    if (existingPendingProposal) {
      return res.status(400).json({
        message: `Đã có đề xuất cho học kỳ ${semester} năm ${schoolYear} đang chờ phê duyệt.`,
      });
    }

    // Lấy danh sách môn học hiện tại để lưu vào đề xuất (để admin biết đang xóa gì)
    const existingSubjects = await SubjectResult.findAll({
      where: { semesterResultId: existingResult.id },
    });

    // Tạo đề xuất DELETE
    const proposal = await GradeProposal.create({
      studentId,
      semester: formattedSemester,
      schoolYear,
      proposalType: "DELETE", // Loại đề xuất là XÓA
      totalCredits: existingResult.totalCredits,
      averageGrade4: existingResult.averageGrade4,
      averageGrade10: existingResult.averageGrade10,
      debtCredits: existingResult.debtCredits,
      failedSubjects: existingResult.failedSubjects,
      status: "PENDING",
      adminNote: reason ? `Lý do xóa: ${reason}` : null, // Lưu lý do xóa
    });

    // Tạo các môn học trong đề xuất (copy từ kết quả hiện tại)
    if (existingSubjects.length) {
      await ProposalSubjectResult.bulkCreate(
        existingSubjects.map((s) => ({
          proposalId: proposal.id,
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          credits: s.credits,
          letterGrade: s.letterGrade,
          gradePoint4: s.gradePoint4,
          gradePoint10: s.gradePoint10,
        }))
      );
    }

    // Gửi thông báo cho admin
    try {
      const adminUsers = await User.findAll({ where: { isAdmin: true } });
      for (const admin of adminUsers) {
        await Notification.create({
          userId: admin.id,
          studentId: null,
          title: "Yêu cầu xóa kết quả học tập",
          content: `Học viên ${student.fullName} (${student.studentId}) yêu cầu xóa kết quả ${formattedSemester} năm học ${schoolYear}.${reason ? `\nLý do: ${reason}` : ""}\nVui lòng xem xét và phê duyệt.`,
          type: "grade_proposal",
          link: "/admin/proposals/grade-results",
          isRead: false,
          targetRole: "ADMIN",
        });
      }
    } catch (notifError) {
      console.error("Error creating notifications for admins:", notifError);
    }

    return res.status(201).json({
      message: "Đã gửi yêu cầu xóa kết quả học tập. Vui lòng chờ Chỉ huy phê duyệt.",
      proposal: {
        ...proposal.toJSON(),
        subjects: existingSubjects.map((s) => ({
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          credits: s.credits,
          letterGrade: s.letterGrade,
          gradePoint4: s.gradePoint4,
          gradePoint10: s.gradePoint10,
        })),
      },
    });
  } catch (error) {
    console.error("Error requesting delete approved grades:", error);
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
};

// Xóa đề xuất kết quả học tập cho học kỳ bằng studentId (user xóa đề xuất của mình)
const deleteSemesterGradesByStudentId = async (req, res) => {
  try {
    const { studentId, semester, schoolYear } = req.params;
    const jwtUser = req.user;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Query User từ database để lấy studentId
    const dbUser = await User.findByPk(jwtUser.id);
    if (!dbUser || !dbUser.studentId || dbUser.studentId !== student.id) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa đề xuất này",
      });
    }

    const formattedSemester = gradeHelper.formatSemester(semester);

    // User chỉ xóa được đề xuất trong bảng grade_proposals
    const proposal = await GradeProposal.findOne({
      where: { studentId, semester: formattedSemester, schoolYear },
    });

    if (!proposal) {
      return res.status(404).json({
        message: `Không tìm thấy đề xuất kết quả học tập cho học kỳ ${semester} năm ${schoolYear}`,
      });
    }

    // Chỉ cho phép xóa đề xuất PENDING hoặc REJECTED
    if (proposal.status === "APPROVED") {
      return res.status(400).json({
        message: "Không thể xóa đề xuất đã được phê duyệt",
      });
    }

    // Xóa tất cả subjects liên quan
    await ProposalSubjectResult.destroy({
      where: { proposalId: proposal.id },
    });

    // Xóa proposal
    await proposal.destroy();

    return res.status(200).json({
      message: `Đã xóa đề xuất kết quả học tập cho học kỳ ${semester} năm ${schoolYear}`,
    });
  } catch (error) {
    console.error("Error deleting proposal by studentId:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getStudentGrades,
  getSemesterGrades,
  addSemesterGrades,
  updateSemesterGrades,
  deleteSemesterGrades,
  deleteSemesterGradesById,
  deleteYearlyResult,
  recalculateAllYearlyResultsAPI,
  getGradeInfo,
  convertGrade,
  calculateAverage,
  getSemesterGradesByStudentId,
  getStudentGradesByStudentId,
  addSemesterGradesByStudentId,
  deleteSemesterGradesByStudentId,
  requestUpdateApprovedGrades,
  requestDeleteApprovedGrades,
};

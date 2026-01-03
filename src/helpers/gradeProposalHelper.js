const { User, Notification, GradeProposal } = require("../models");
const gradeHelper = require("./gradeHelper");

/**
 * Kiểm tra xem đã có đề xuất PENDING cho học kỳ này chưa
 */
const checkPendingProposal = async (studentId, semester, schoolYear) => {
  const formattedSemester = gradeHelper.formatSemester(semester);
  return await GradeProposal.findOne({
    where: {
      studentId,
      semester: formattedSemester,
      schoolYear,
      status: "PENDING",
    },
  });
};

/**
 * Validate danh sách môn học
 */
const validateSubjects = (subjects) => {
  for (const subject of subjects) {
    const grade10 = parseFloat(subject.gradePoint10);
    if (isNaN(grade10) || grade10 < 0 || grade10 > 10) {
      return {
        valid: false,
        message: `Điểm hệ 10 của môn "${
          subject.subjectName || subject.subjectCode
        }" phải từ 0 đến 10`,
      };
    }
    const credits = parseInt(subject.credits);
    if (isNaN(credits) || credits <= 0) {
      return {
        valid: false,
        message: `Số tín chỉ của môn "${
          subject.subjectName || subject.subjectCode
        }" không hợp lệ`,
      };
    }
  }
  return { valid: true };
};

/**
 * Xử lý dữ liệu môn học (tính điểm chữ và điểm hệ 4)
 */
const processSubjects = (subjects) => {
  return subjects.map((subject) => {
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
};

/**
 * Tạo thông báo cho tất cả admin về đề xuất mới
 */
const notifyAdminsAboutProposal = async (
  student,
  semester,
  schoolYear,
  proposalType,
  proposalId,
  reason = null
) => {
  try {
    const adminUsers = await User.findAll({ where: { isAdmin: true } });
    if (adminUsers.length === 0) return;

    const typeMessages = {
      CREATE: {
        title: "Yêu cầu thêm kết quả học tập",
        content: `Học viên ${student.fullName} (${student.studentId}) yêu cầu thêm kết quả ${semester} năm học ${schoolYear}. Vui lòng xem xét và phê duyệt.`,
      },
      UPDATE: {
        title: "Yêu cầu cập nhật kết quả học tập",
        content: `Học viên ${student.fullName} (${student.studentId}) yêu cầu cập nhật kết quả ${semester} năm học ${schoolYear}. Vui lòng xem xét và phê duyệt.`,
      },
      DELETE: {
        title: "Yêu cầu xóa kết quả học tập",
        content: `Học viên ${student.fullName} (${
          student.studentId
        }) yêu cầu xóa kết quả ${semester} năm học ${schoolYear}.${
          reason ? `\nLý do: ${reason}` : ""
        }\nVui lòng xem xét và phê duyệt.`,
      },
    };

    const message = typeMessages[proposalType] || typeMessages.CREATE;

    const notifications = adminUsers.map((admin) => ({
      userId: admin.id,
      studentId: null,
      title: message.title,
      content: message.content,
      type: "grade_proposal",
      link: "/admin/proposals/grade-results",
      isRead: false,
      targetRole: "ADMIN",
      relatedId: proposalId,
    }));

    await Notification.bulkCreate(notifications);
  } catch (error) {
    console.error("Error creating notifications for admins:", error);
  }
};

module.exports = {
  checkPendingProposal,
  validateSubjects,
  processSubjects,
  notifyAdminsAboutProposal,
};


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

// Trạng thái phê duyệt (viết hoa)
const APPROVAL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

/**
 * Lấy danh sách đề xuất kết quả học tập chờ duyệt (cho admin)
 */
const getPendingGrades = async (req, res) => {
  try {
    const { page = 1, limit = 20, schoolYear, semester } = req.query;

    const whereClause = { status: APPROVAL_STATUS.PENDING };
    if (schoolYear) whereClause.schoolYear = schoolYear;
    if (semester) whereClause.semester = gradeHelper.formatSemester(semester);

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await GradeProposal.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "studentId", "fullName", "classId"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    // Lấy subjects cho mỗi proposal
    const proposalIds = rows.map((r) => r.id);
    const subjects = await ProposalSubjectResult.findAll({
      where: { proposalId: proposalIds },
    });

    const subjectsByProposalId = subjects.reduce((acc, s) => {
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

    const pendingGrades = rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      student: r.student
        ? {
            id: r.student.id,
            studentId: r.student.studentId,
            fullName: r.student.fullName,
          }
        : null,
      semester: r.semester,
      schoolYear: r.schoolYear,
      proposalType: r.proposalType || "CREATE", // CREATE, UPDATE, DELETE
      subjects: subjectsByProposalId[r.id] || [],
      totalCredits: r.totalCredits,
      averageGrade4: r.averageGrade4,
      averageGrade10: r.averageGrade10,
      status: r.status,
      adminNote: r.adminNote,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.status(200).json({
      data: pendingGrades,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting pending grades:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Lấy tất cả đề xuất kết quả học tập với trạng thái (cho admin)
 */
const getAllGradesWithStatus = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, schoolYear, semester } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (schoolYear) whereClause.schoolYear = schoolYear;
    if (semester) whereClause.semester = gradeHelper.formatSemester(semester);

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await GradeProposal.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "studentId", "fullName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    const proposalIds = rows.map((r) => r.id);
    const subjects = await ProposalSubjectResult.findAll({
      where: { proposalId: proposalIds },
    });

    const subjectsByProposalId = subjects.reduce((acc, s) => {
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

    const grades = rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      student: r.student
        ? {
            id: r.student.id,
            studentId: r.student.studentId,
            fullName: r.student.fullName,
          }
        : null,
      semester: r.semester,
      schoolYear: r.schoolYear,
      proposalType: r.proposalType || "CREATE", // CREATE, UPDATE, DELETE
      subjects: subjectsByProposalId[r.id] || [],
      totalCredits: r.totalCredits,
      averageGrade4: r.averageGrade4,
      averageGrade10: r.averageGrade10,
      status: r.status,
      adminNote: r.adminNote,
      approvedBy: r.approvedBy,
      approvedAt: r.approvedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.status(200).json({
      data: grades,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting all grades with status:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Phê duyệt đề xuất kết quả học tập
 * - CREATE: Copy từ grade_proposals sang semester_results
 * - UPDATE: Cập nhật semester_results từ grade_proposals
 * - DELETE: Xóa semester_results
 */
const approveGrade = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { adminNote } = req.body;
    const adminId = req.user?.id;

    const proposal = await GradeProposal.findByPk(proposalId, {
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "studentId", "fullName"],
        },
      ],
    });

    if (!proposal) {
      return res.status(404).json({ message: "Không tìm thấy đề xuất" });
    }

    if (proposal.status === APPROVAL_STATUS.APPROVED) {
      return res.status(400).json({ message: "Đề xuất đã được duyệt trước đó" });
    }

    const proposalType = proposal.proposalType || "CREATE";
    let semesterResult = null;
    let message = "";

    // Xử lý theo loại đề xuất
    if (proposalType === "DELETE") {
      // === XÓA KẾT QUẢ ===
      const existingResult = await SemesterResult.findOne({
        where: {
          studentId: proposal.studentId,
          semester: proposal.semester,
          schoolYear: proposal.schoolYear,
        },
      });

      if (!existingResult) {
        return res.status(404).json({
          message: `Không tìm thấy kết quả học tập để xóa`,
        });
      }

      // Xóa subjects trước
      await SubjectResult.destroy({
        where: { semesterResultId: existingResult.id },
      });

      // Xóa semester result
      await existingResult.destroy();

      message = "Đã phê duyệt yêu cầu xóa kết quả học tập thành công";

    } else if (proposalType === "UPDATE") {
      // === CẬP NHẬT KẾT QUẢ ===
      const existingResult = await SemesterResult.findOne({
        where: {
          studentId: proposal.studentId,
          semester: proposal.semester,
          schoolYear: proposal.schoolYear,
        },
      });

      if (!existingResult) {
        return res.status(404).json({
          message: `Không tìm thấy kết quả học tập để cập nhật`,
        });
      }

      // Lấy subjects từ proposal
      const proposalSubjects = await ProposalSubjectResult.findAll({
        where: { proposalId: proposal.id },
      });

      // Xóa subjects cũ
      await SubjectResult.destroy({
        where: { semesterResultId: existingResult.id },
      });

      // Thêm subjects mới từ proposal
      if (proposalSubjects.length > 0) {
        await SubjectResult.bulkCreate(
          proposalSubjects.map((s) => ({
            semesterResultId: existingResult.id,
            subjectCode: s.subjectCode,
            subjectName: s.subjectName,
            credits: s.credits,
            letterGrade: s.letterGrade,
            gradePoint4: s.gradePoint4,
            gradePoint10: s.gradePoint10,
          }))
        );
      }

      // Cập nhật semester result
      await existingResult.update({
        totalCredits: proposal.totalCredits,
        averageGrade4: proposal.averageGrade4,
        averageGrade10: proposal.averageGrade10,
        debtCredits: proposal.debtCredits,
        failedSubjects: proposal.failedSubjects,
      });

      semesterResult = existingResult;
      message = "Đã phê duyệt yêu cầu cập nhật kết quả học tập thành công";

    } else {
      // === TẠO MỚI (CREATE) ===
      const existingResult = await SemesterResult.findOne({
        where: {
          studentId: proposal.studentId,
          semester: proposal.semester,
          schoolYear: proposal.schoolYear,
        },
      });

      if (existingResult) {
        return res.status(400).json({
          message: `Đã có kết quả học tập chính thức cho học kỳ ${proposal.semester} năm ${proposal.schoolYear}`,
        });
      }

      // Lấy subjects từ proposal
      const proposalSubjects = await ProposalSubjectResult.findAll({
        where: { proposalId: proposal.id },
      });

      // Tạo semester result từ proposal
      semesterResult = await SemesterResult.create({
        studentId: proposal.studentId,
        semester: proposal.semester,
        schoolYear: proposal.schoolYear,
        totalCredits: proposal.totalCredits,
        averageGrade4: proposal.averageGrade4,
        averageGrade10: proposal.averageGrade10,
        cumulativeCredits: 0,
        cumulativeGrade4: 0,
        cumulativeGrade10: 0,
        debtCredits: proposal.debtCredits,
        failedSubjects: proposal.failedSubjects,
      });

      // Copy subjects từ proposal sang semester result
      if (proposalSubjects.length > 0) {
        await SubjectResult.bulkCreate(
          proposalSubjects.map((s) => ({
            semesterResultId: semesterResult.id,
            subjectCode: s.subjectCode,
            subjectName: s.subjectName,
            credits: s.credits,
            letterGrade: s.letterGrade,
            gradePoint4: s.gradePoint4,
            gradePoint10: s.gradePoint10,
          }))
        );
      }

      message = "Đã phê duyệt đề xuất kết quả học tập thành công";
    }

    // Cập nhật trạng thái proposal thành approved
    await proposal.update({
      status: APPROVAL_STATUS.APPROVED,
      adminNote: adminNote || null,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    // Tính lại CPA và YearlyResult
    await recalculateApprovedYearlyResults(proposal.studentId);

    // Tạo thông báo cho user (student)
    try {
      const student = proposal.student;
      if (student) {
        const studentUser = await User.findOne({
          where: { studentId: student.id },
        });

        if (studentUser) {
          let notificationTitle = "";
          let notificationContent = "";

          if (proposalType === "DELETE") {
            notificationTitle = "Yêu cầu xóa đã được duyệt";
            notificationContent = `Yêu cầu xóa kết quả học tập ${proposal.semester} năm học ${proposal.schoolYear} của bạn đã được phê duyệt.${adminNote ? ` Ghi chú: ${adminNote}` : ""}`;
          } else if (proposalType === "UPDATE") {
            notificationTitle = "Yêu cầu cập nhật đã được duyệt";
            notificationContent = `Yêu cầu cập nhật kết quả học tập ${proposal.semester} năm học ${proposal.schoolYear} của bạn đã được phê duyệt.${adminNote ? ` Ghi chú: ${adminNote}` : ""}`;
          } else {
            const notificationData = NOTIFICATION_TEMPLATES.gradeApproved(
              proposal.semester,
              proposal.schoolYear,
              adminNote
            );
            notificationTitle = notificationData.title;
            notificationContent = notificationData.content;
          }

          await Notification.create({
            studentId: student.id,
            userId: studentUser.id,
            targetRole: TARGET_ROLES.USER,
            title: notificationTitle,
            content: notificationContent,
            type: "grade_approved",
            link: "/users/proposals/grade-results",
            relatedId: semesterResult?.id || null,
          });
        }
      }
    } catch (notifError) {
      console.error("Error creating notification for student:", notifError);
    }

    return res.status(200).json({
      message,
      semesterResult: semesterResult ? {
        id: semesterResult.id,
        semester: semesterResult.semester,
        schoolYear: semesterResult.schoolYear,
      } : null,
      proposal: {
        id: proposal.id,
        proposalType: proposalType,
        status: proposal.status,
        adminNote: proposal.adminNote,
        approvedBy: proposal.approvedBy,
        approvedAt: proposal.approvedAt,
      },
    });
  } catch (error) {
    console.error("Error approving grade:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Phê duyệt nhiều đề xuất cùng lúc
 */
const bulkApproveGrades = async (req, res) => {
  try {
    const { proposalIds, adminNote } = req.body;
    const adminId = req.user?.id;

    if (!Array.isArray(proposalIds) || proposalIds.length === 0) {
      return res.status(400).json({ message: "Danh sách đề xuất không hợp lệ" });
    }

    const proposals = await GradeProposal.findAll({
      where: {
        id: proposalIds,
        status: APPROVAL_STATUS.PENDING,
      },
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "studentId", "fullName"],
        },
      ],
    });

    if (proposals.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đề xuất chờ duyệt" });
    }

    const approvedProposals = [];
    const skippedProposals = [];

    for (const proposal of proposals) {
      // Kiểm tra xem đã có kết quả chính thức chưa
      const existingResult = await SemesterResult.findOne({
        where: {
          studentId: proposal.studentId,
          semester: proposal.semester,
          schoolYear: proposal.schoolYear,
        },
      });

      if (existingResult) {
        skippedProposals.push({
          id: proposal.id,
          reason: `Đã có kết quả chính thức cho ${proposal.semester} ${proposal.schoolYear}`,
        });
        continue;
      }

      // Lấy subjects từ proposal
      const proposalSubjects = await ProposalSubjectResult.findAll({
        where: { proposalId: proposal.id },
      });

      // Tạo semester result
      const semesterResult = await SemesterResult.create({
        studentId: proposal.studentId,
        semester: proposal.semester,
        schoolYear: proposal.schoolYear,
        totalCredits: proposal.totalCredits,
        averageGrade4: proposal.averageGrade4,
        averageGrade10: proposal.averageGrade10,
        cumulativeCredits: 0,
        cumulativeGrade4: 0,
        cumulativeGrade10: 0,
        debtCredits: proposal.debtCredits,
        failedSubjects: proposal.failedSubjects,
      });

      // Copy subjects
      if (proposalSubjects.length > 0) {
        await SubjectResult.bulkCreate(
          proposalSubjects.map((s) => ({
            semesterResultId: semesterResult.id,
            subjectCode: s.subjectCode,
            subjectName: s.subjectName,
            credits: s.credits,
            letterGrade: s.letterGrade,
            gradePoint4: s.gradePoint4,
            gradePoint10: s.gradePoint10,
          }))
        );
      }

      // Cập nhật proposal
      await proposal.update({
        status: APPROVAL_STATUS.APPROVED,
        adminNote: adminNote || null,
        approvedBy: adminId,
        approvedAt: new Date(),
      });

      approvedProposals.push(proposal);
    }

    // Tính lại CPA cho từng sinh viên
    const studentIds = [...new Set(approvedProposals.map((p) => p.studentId))];
    for (const studentId of studentIds) {
      await recalculateApprovedYearlyResults(studentId);
    }

    // Tạo thông báo
    try {
      const notifications = [];
      for (const proposal of approvedProposals) {
        const student = proposal.student;
        if (student) {
          const studentUser = await User.findOne({
            where: { studentId: student.id },
          });

          if (studentUser) {
            const notificationData = NOTIFICATION_TEMPLATES.gradeApproved(
              proposal.semester,
              proposal.schoolYear,
              adminNote
            );

            notifications.push({
              studentId: student.id,
              userId: studentUser.id,
              targetRole: TARGET_ROLES.USER,
              title: notificationData.title,
              content: notificationData.content,
              type: notificationData.type,
              link: notificationData.link,
              relatedId: proposal.id,
            });
          }
        }
      }

      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }
    } catch (notifError) {
      console.error("Error creating bulk notifications:", notifError);
    }

    return res.status(200).json({
      message: `Đã phê duyệt ${approvedProposals.length} đề xuất`,
      approvedCount: approvedProposals.length,
      skippedCount: skippedProposals.length,
      skipped: skippedProposals,
    });
  } catch (error) {
    console.error("Error bulk approving grades:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Từ chối nhiều đề xuất cùng lúc
 */
const bulkRejectGrades = async (req, res) => {
  try {
    const { proposalIds, adminNote } = req.body;
    const adminId = req.user?.id;

    if (!adminNote) {
      return res.status(400).json({ message: "Vui lòng nhập lý do từ chối" });
    }

    if (!Array.isArray(proposalIds) || proposalIds.length === 0) {
      return res.status(400).json({ message: "Danh sách đề xuất không hợp lệ" });
    }

    const proposals = await GradeProposal.findAll({
      where: {
        id: proposalIds,
        status: APPROVAL_STATUS.PENDING,
      },
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "studentId", "fullName"],
        },
      ],
    });

    if (proposals.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đề xuất chờ duyệt" });
    }

    // Cập nhật tất cả thành rejected
    await GradeProposal.update(
      {
        status: APPROVAL_STATUS.REJECTED,
        adminNote: adminNote,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      {
        where: {
          id: proposals.map((p) => p.id),
        },
      }
    );

    // Tạo thông báo
    try {
      const notifications = [];
      for (const proposal of proposals) {
        const student = proposal.student;
        if (student) {
          const studentUser = await User.findOne({
            where: { studentId: student.id },
          });

          if (studentUser) {
            const notificationData = NOTIFICATION_TEMPLATES.gradeRejected(
              proposal.semester,
              proposal.schoolYear,
              adminNote
            );

            notifications.push({
              studentId: student.id,
              userId: studentUser.id,
              targetRole: TARGET_ROLES.USER,
              title: notificationData.title,
              content: notificationData.content,
              type: notificationData.type,
              link: notificationData.link,
              relatedId: proposal.id,
            });
          }
        }
      }

      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }
    } catch (notifError) {
      console.error("Error creating bulk reject notifications:", notifError);
    }

    return res.status(200).json({
      message: `Đã từ chối ${proposals.length} đề xuất`,
      rejectedCount: proposals.length,
    });
  } catch (error) {
    console.error("Error bulk rejecting grades:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Từ chối đề xuất kết quả học tập
 */
const rejectGrade = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { adminNote } = req.body;
    const adminId = req.user?.id;

    if (!adminNote) {
      return res.status(400).json({ message: "Vui lòng nhập lý do từ chối" });
    }

    const proposal = await GradeProposal.findByPk(proposalId, {
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["id", "studentId", "fullName"],
        },
      ],
    });

    if (!proposal) {
      return res.status(404).json({ message: "Không tìm thấy đề xuất" });
    }

    if (proposal.status === APPROVAL_STATUS.REJECTED) {
      return res.status(400).json({ message: "Đề xuất đã bị từ chối trước đó" });
    }

    // Cập nhật trạng thái thành rejected
    await proposal.update({
      status: APPROVAL_STATUS.REJECTED,
      adminNote,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    // Tạo thông báo cho user (student)
    try {
      const student = proposal.student;
      if (student) {
        const studentUser = await User.findOne({
          where: { studentId: student.id },
        });

        if (studentUser) {
          const notificationData = NOTIFICATION_TEMPLATES.gradeRejected(
            proposal.semester,
            proposal.schoolYear,
            adminNote
          );

          await Notification.create({
            studentId: student.id,
            userId: studentUser.id,
            targetRole: TARGET_ROLES.USER,
            title: notificationData.title,
            content: notificationData.content,
            type: notificationData.type,
            link: notificationData.link,
            relatedId: proposal.id,
          });
        }
      }
    } catch (notifError) {
      console.error("Error creating notification for student:", notifError);
    }

    return res.status(200).json({
      message: "Đã từ chối đề xuất",
      proposal: {
        id: proposal.id,
        status: proposal.status,
        adminNote: proposal.adminNote,
      },
    });
  } catch (error) {
    console.error("Error rejecting grade:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Đếm số lượng đề xuất theo trạng thái
 */
const getGradeStatusCounts = async (req, res) => {
  try {
    const pendingCount = await GradeProposal.count({
      where: { status: APPROVAL_STATUS.PENDING },
    });

    const approvedCount = await GradeProposal.count({
      where: { status: APPROVAL_STATUS.APPROVED },
    });

    const rejectedCount = await GradeProposal.count({
      where: { status: APPROVAL_STATUS.REJECTED },
    });

    return res.status(200).json({
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: pendingCount + approvedCount + rejectedCount,
    });
  } catch (error) {
    console.error("Error getting grade status counts:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Tính lại CPA và YearlyResult từ các kết quả đã được duyệt (trong semester_results)
 */
const recalculateApprovedYearlyResults = async (studentId) => {
  // Lấy tất cả semester results (đều là đã duyệt vì chỉ khi duyệt mới lưu vào đây)
  const semesters = await SemesterResult.findAll({
    where: { studentId },
    order: [
      ["schoolYear", "ASC"],
      ["semester", "ASC"],
    ],
  });

  if (!semesters.length) {
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

  // Tính CPA tích lũy
  let cumulativeTotalCredits = 0;
  let cumulativeTotalGradePoints4 = 0;
  let cumulativeTotalGradePoints10 = 0;

  for (const semesterData of semestersWithSubjects) {
    const subjects = semesterData.subjects || [];

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

    await SemesterResult.update(
      {
        cumulativeCredits: cumulativeTotalCredits,
        cumulativeGrade4: cumulativeGrade4,
        cumulativeGrade10: cumulativeGrade10,
      },
      { where: { id: semesterData.id } }
    );
  }

  // Nhóm theo năm học
  const semestersByYear = {};
  semestersWithSubjects.forEach((r) => {
    if (!semestersByYear[r.schoolYear]) semestersByYear[r.schoolYear] = [];
    semestersByYear[r.schoolYear].push(r);
  });

  const validYears = Object.keys(semestersByYear).sort();
  let yearCumulativeCredits = 0;
  let yearCumulativeGradePoints4 = 0;
  let yearCumulativeGradePoints10 = 0;

  for (const schoolYear of validYears) {
    const yearSemesters = semestersByYear[schoolYear];
    const semesterIds = yearSemesters.map((s) => s.id);

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
      yearlyTotalCredits > 0
        ? yearlyTotalGradePoints4 / yearlyTotalCredits
        : 0;
    const yearlyGrade10 =
      yearlyTotalCredits > 0
        ? yearlyTotalGradePoints10 / yearlyTotalCredits
        : 0;

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

    const studentLevel = gradeHelper.calculateStudentLevel(yearCumulativeCredits);

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
        studentLevel,
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
        studentLevel,
        semesterIds,
      });
    }

    await SemesterResult.update(
      { yearlyResultId: yr.id },
      { where: { id: semesterIds } }
    );
  }

  // Xóa YearlyResult không còn semester
  await YearlyResult.destroy({
    where: { studentId, schoolYear: { [Op.notIn]: validYears } },
  });
};

module.exports = {
  getPendingGrades,
  getAllGradesWithStatus,
  approveGrade,
  bulkApproveGrades,
  bulkRejectGrades,
  rejectGrade,
  getGradeStatusCounts,
  recalculateApprovedYearlyResults,
  APPROVAL_STATUS,
};

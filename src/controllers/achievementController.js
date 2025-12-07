const { Op } = require("sequelize");
const {
  User,
  Student,
  AchievementProfile,
  YearlyAchievement,
  ScientificInitiative,
  ScientificTopic,
  Notification,
} = require("../models");
const {
  TARGET_ROLES,
  NOTIFICATION_TEMPLATES,
} = require("../helpers/notificationHelper");

/**
 * @swagger
 * components:
 *   schemas:
 *     AchievementProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Achievement profile ID
 *         studentId:
 *           type: string
 *           description: Student ID
 *         totalYears:
 *           type: integer
 *           description: Total years
 *         totalAdvancedSoldier:
 *           type: integer
 *           description: Total advanced soldier
 *         totalCompetitiveSoldier:
 *           type: integer
 *           description: Total competitive soldier
 *         totalScientificTopics:
 *           type: integer
 *           description: Total scientific topics
 *         totalScientificInitiatives:
 *           type: integer
 *           description: Total scientific initiatives
 *         eligibleForMinistryReward:
 *           type: boolean
 *           description: Eligible for ministry reward
 *         eligibleForNationalReward:
 *           type: boolean
 *           description: Eligible for national reward
 *     YearlyAchievement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Yearly achievement ID
 *         studentId:
 *           type: string
 *           description: Student ID
 *         year:
 *           type: integer
 *           description: Year
 *         decisionNumber:
 *           type: string
 *           description: Decision number
 *         decisionDate:
 *           type: string
 *           format: date
 *           description: Decision date
 *         title:
 *           type: string
 *           description: Title
 *         description:
 *           type: string
 *           description: Description
 *         award:
 *           type: string
 *           description: Award
 *         level:
 *           type: string
 *           description: Level
 */

// Helper: build response theo API cũ từ dữ liệu SQL
const buildAchievementResponse = async (studentId) => {
  // Lấy các bản ghi theo năm + initiatives/topics
  const yearly = await YearlyAchievement.findAll({
    where: { studentId },
    order: [["year", "ASC"]],
    include: [
      { model: ScientificInitiative, required: false },
      { model: ScientificTopic, required: false },
    ],
  });

  // Map về structure cũ - PHẢI BẮT ĐẦU VỚI id để frontend có thể update/delete
  const yearlyAchievements = yearly.map((ya) => ({
    id: ya.id, // ← THÊM id để frontend có thể update/delete
    year: ya.year,
    decisionNumber: ya.decisionNumber,
    decisionDate: ya.decisionDate,
    title: ya.title,
    hasMinistryReward: ya.hasMinistryReward,
    hasNationalReward: ya.hasNationalReward,
    notes: ya.notes,
    scientific: {
      initiatives: (ya.scientific_initiatives || []).map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description || "",
        year: i.year || new Date().getFullYear(),
        status: i.status,
      })),
      topics: (ya.scientific_topics || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        year: t.year || new Date().getFullYear(),
        status: t.status,
      })),
    },
  }));

  // Tính toán thống kê
  const stats = await calculateAchievementStatsSQL(
    studentId,
    yearlyAchievements
  );

  return {
    studentId,
    yearlyAchievements,
    ...stats,
  };
};

// Lấy thông tin khen thưởng của student
const getStudentAchievement = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Đảm bảo có AchievementProfile
    await AchievementProfile.findOrCreate({
      where: { studentId },
      defaults: { studentId },
    });

    const resp = await buildAchievementResponse(studentId);
    return res.status(200).json(resp);
  } catch (error) {
    console.error("Error getting achievement:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách tất cả achievement theo năm cho admin (map theo API cũ)
const getAllAchievements = async (req, res) => {
  try {
    const items = await YearlyAchievement.findAll({
      include: [{ model: Student }],
      order: [["year", "DESC"]],
    });
    const results = items.map((ya) => ({
      studentId: ya.studentId,
      year: ya.year,
      decisionNumber: ya.decisionNumber,
      decisionDate: ya.decisionDate,
      title: ya.title,
      hasMinistryReward: ya.hasMinistryReward,
      hasNationalReward: ya.hasNationalReward,
      notes: ya.notes,
      student: ya.student
        ? { id: ya.student.id, fullName: ya.student.fullName }
        : null,
    }));
    return res.status(200).json(results);
  } catch (error) {
    console.error("Error getting all achievements:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách học viên cho admin
const getStudentsForAdmin = async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes: ["id", "fullName", "unit", "studentId"],
      order: [["fullName", "ASC"]],
    });

    // Populate achievement for each student
    const studentsWithAchievements = await Promise.all(
      students.map(async (student) => {
        try {
          const achievement = await buildAchievementResponse(student.id);
          return {
            ...student.toJSON(),
            achievement,
          };
        } catch (error) {
          // If no achievement, return student with null achievement
          return {
            ...student.toJSON(),
            achievement: null,
          };
        }
      })
    );

    return res.status(200).json(studentsWithAchievements);
  } catch (error) {
    console.error("Error getting students:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm khen thưởng mới (theo user)
const addYearlyAchievement = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year, decisionNumber, decisionDate, title, scientific, notes } =
      req.body;

    const existed = await YearlyAchievement.findOne({
      where: { studentId, year: parseInt(year) },
    });
    if (existed) {
      return res.status(400).json({ message: "Năm này đã có khen thưởng" });
    }

    const created = await YearlyAchievement.create({
      studentId,
      year: parseInt(year),
      decisionNumber,
      decisionDate: decisionDate ? new Date(decisionDate) : null,
      title,
      notes,
    });

    // initiatives/topics
    if (scientific?.initiatives?.length) {
      await ScientificInitiative.bulkCreate(
        scientific.initiatives.map((i) => ({
          yearlyAchievementId: created.id,
          title: i.title,
          description: i.description || "",
          year: i.year || new Date().getFullYear(),
          status: i.status || "pending",
        }))
      );
    }
    if (scientific?.topics?.length) {
      await ScientificTopic.bulkCreate(
        scientific.topics.map((t) => ({
          yearlyAchievementId: created.id,
          title: t.title,
          description: t.description || "",
          year: t.year || new Date().getFullYear(),
          status: t.status || "pending",
        }))
      );
    }

    const resp = await buildAchievementResponse(studentId);
    return res.status(201).json(resp);
  } catch (error) {
    console.error("Error adding achievement:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm khen thưởng cho admin (theo studentId)
const addYearlyAchievementByAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      year,
      decisionNumber,
      decisionDate,
      title,
      scientific,
      notes,
      hasMinistryReward,
      hasNationalReward,
    } = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    const exists = await YearlyAchievement.findOne({
      where: { studentId, year: parseInt(year) },
    });
    if (exists) {
      return res.status(400).json({
        message: `Năm ${year} đã có khen thưởng, không thể thêm mới`,
      });
    }

    const created = await YearlyAchievement.create({
      studentId,
      year: parseInt(year),
      decisionNumber,
      decisionDate: decisionDate ? new Date(decisionDate) : null,
      title,
      notes,
      hasMinistryReward: hasMinistryReward || false,
      hasNationalReward: hasNationalReward || false,
    });

    if (scientific?.initiatives?.length) {
      await ScientificInitiative.bulkCreate(
        scientific.initiatives.map((i) => ({
          yearlyAchievementId: created.id,
          title: i.title,
          description: i.description || "",
          year: i.year || new Date().getFullYear(),
          status: i.status || "pending",
        }))
      );
    }
    if (scientific?.topics?.length) {
      await ScientificTopic.bulkCreate(
        scientific.topics.map((t) => ({
          yearlyAchievementId: created.id,
          title: t.title,
          description: t.description || "",
          year: t.year || new Date().getFullYear(),
          status: t.status || "pending",
        }))
      );
    }

    // Tạo thông báo cho học viên
    try {
      const studentUser = await User.findOne({
        where: { studentId: student.id },
      });

      if (studentUser) {
        const achievementTitle = title || "Khen thưởng";
        const notificationData = NOTIFICATION_TEMPLATES.achievementAwarded(
          achievementTitle,
          year
        );

        await Notification.create({
          studentId: student.id,
          userId: studentUser.id,
          targetRole: TARGET_ROLES.USER,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type,
          link: notificationData.link,
          relatedId: created.id,
        });
      }
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    const resp = await buildAchievementResponse(studentId);
    return res.status(201).json({
      achievement: resp,
      message: "Thêm khen thưởng thành công",
      action: "create",
    });
  } catch (error) {
    console.error("Error adding achievement:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật khen thưởng
const updateYearlyAchievement = async (req, res) => {
  try {
    const { studentId, year } = req.params;
    const updateData = req.body;

    const ya = await YearlyAchievement.findOne({
      where: { studentId, year: parseInt(year) },
    });
    if (!ya) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy khen thưởng năm này" });
    }

    // Cập nhật fields chính
    const fields = [
      "decisionNumber",
      "decisionDate",
      "title",
      "notes",
      "hasMinistryReward",
      "hasNationalReward",
    ];
    const payload = {};
    fields.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(updateData, f)) {
        payload[f] =
          f === "decisionDate" && updateData[f]
            ? new Date(updateData[f])
            : updateData[f];
      }
    });
    await ya.update(payload);

    // Cập nhật scientific nếu được gửi lên: replace đơn giản
    if (updateData.scientific) {
      await ScientificInitiative.destroy({
        where: { yearlyAchievementId: ya.id },
      });
      await ScientificTopic.destroy({ where: { yearlyAchievementId: ya.id } });
      if (updateData.scientific.initiatives?.length) {
        await ScientificInitiative.bulkCreate(
          updateData.scientific.initiatives.map((i) => ({
            yearlyAchievementId: ya.id,
            title: i.title,
            description: i.description || "",
            year: i.year || new Date().getFullYear(),
            status: i.status || "pending",
          }))
        );
      }
      if (updateData.scientific.topics?.length) {
        await ScientificTopic.bulkCreate(
          updateData.scientific.topics.map((t) => ({
            yearlyAchievementId: ya.id,
            title: t.title,
            description: t.description || "",
            year: t.year || new Date().getFullYear(),
            status: t.status || "pending",
          }))
        );
      }
    }

    const resp = await buildAchievementResponse(studentId);
    return res.status(200).json(resp);
  } catch (error) {
    console.error("Error updating achievement:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật khen thưởng cho admin - theo achievementId
const updateYearlyAchievementByAdmin = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const updateData = req.body;

    const ya = await YearlyAchievement.findByPk(achievementId);
    if (!ya) {
      return res.status(404).json({ message: "Không tìm thấy khen thưởng" });
    }

    const fields = [
      "year", // ← THÊM year để có thể cập nhật năm
      "decisionNumber",
      "decisionDate",
      "title",
      "notes",
      "hasMinistryReward",
      "hasNationalReward",
    ];
    const payload = {};
    fields.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(updateData, f)) {
        payload[f] =
          f === "decisionDate" && updateData[f]
            ? new Date(updateData[f])
            : updateData[f];
      }
    });
    await ya.update(payload);

    if (updateData.scientific) {
      await ScientificInitiative.destroy({
        where: { yearlyAchievementId: ya.id },
      });
      await ScientificTopic.destroy({ where: { yearlyAchievementId: ya.id } });
      if (updateData.scientific.initiatives?.length) {
        await ScientificInitiative.bulkCreate(
          updateData.scientific.initiatives.map((i) => ({
            yearlyAchievementId: ya.id,
            title: i.title,
            description: i.description || "",
            year: i.year || new Date().getFullYear(),
            status: i.status || "pending",
          }))
        );
      }
      if (updateData.scientific.topics?.length) {
        await ScientificTopic.bulkCreate(
          updateData.scientific.topics.map((t) => ({
            yearlyAchievementId: ya.id,
            title: t.title,
            description: t.description || "",
            year: t.year || new Date().getFullYear(),
            status: t.status || "pending",
          }))
        );
      }
    }

    const resp = await buildAchievementResponse(ya.studentId);

    // Tạo thông báo cho học viên khi khen thưởng được cập nhật
    try {
      const student = await Student.findByPk(ya.studentId);
      if (student) {
        const studentUser = await User.findOne({
          where: { studentId: student.id },
        });

        if (studentUser) {
          const achievementTitle = payload.title || ya.title || "Khen thưởng";
          const notificationData = NOTIFICATION_TEMPLATES.achievementUpdated(
            achievementTitle,
            ya.year
          );

          await Notification.create({
            studentId: ya.studentId,
            userId: studentUser.id,
            targetRole: TARGET_ROLES.USER,
            title: notificationData.title,
            content: notificationData.content,
            type: notificationData.type,
            link: notificationData.link,
            relatedId: ya.id,
          });
        }
      }
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    return res.status(200).json(resp);
  } catch (error) {
    console.error("Error updating achievement:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa khen thưởng
const deleteYearlyAchievement = async (req, res) => {
  try {
    const { studentId, year } = req.params;

    // Lấy thông tin trước khi xóa
    const ya = await YearlyAchievement.findOne({
      where: { studentId, year: parseInt(year) },
    });

    if (!ya) {
      return res.status(404).json({ message: "Không tìm thấy khen thưởng" });
    }

    await YearlyAchievement.destroy({
      where: { studentId, year: parseInt(year) },
    });

    // Tính lại stats sau khi xóa - QUAN TRỌNG để cập nhật eligibleForMinistryReward và eligibleForNationalReward
    const resp = await buildAchievementResponse(studentId);

    return res.status(200).json({
      message: "Xóa khen thưởng thành công",
      achievement: resp,
    });
  } catch (error) {
    console.error("Error deleting achievement:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa khen thưởng cho admin - theo achievementId
const deleteYearlyAchievementByAdmin = async (req, res) => {
  try {
    const { achievementId } = req.params;

    const ya = await YearlyAchievement.findByPk(achievementId);
    if (!ya) {
      return res.status(404).json({ message: "Không tìm thấy khen thưởng" });
    }

    // Lưu thông tin trước khi xóa để tạo notification và tính lại stats
    const { studentId, title, year } = ya;

    await YearlyAchievement.destroy({
      where: { id: achievementId },
    });

    // Tính lại stats sau khi xóa - QUAN TRỌNG để cập nhật eligibleForMinistryReward và eligibleForNationalReward
    const resp = await buildAchievementResponse(studentId);

    // Tạo thông báo cho học viên khi khen thưởng bị xóa
    try {
      const student = await Student.findByPk(studentId);
      if (student) {
        const studentUser = await User.findOne({
          where: { studentId: student.id },
        });

        if (studentUser) {
          const achievementTitle = title || "Khen thưởng";
          const notificationData = NOTIFICATION_TEMPLATES.achievementDeleted(
            achievementTitle,
            year
          );

          await Notification.create({
            studentId: studentId,
            userId: studentUser.id,
            targetRole: TARGET_ROLES.USER,
            title: notificationData.title,
            content: notificationData.content,
            type: notificationData.type,
            link: notificationData.link,
          });
        }
      }
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    return res.status(200).json({
      message: "Xóa khen thưởng thành công",
      achievement: resp,
    });
  } catch (error) {
    console.error("Error deleting achievement:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy đề xuất khen thưởng cho năm tiếp theo
const getRecommendations = async (req, res) => {
  try {
    const { studentId } = req.params;

    const resp = await buildAchievementResponse(studentId);

    const recommendationsPayload = buildRecommendationsFromResponse(resp);
    return res.status(200).json(recommendationsPayload);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy đề xuất khen thưởng cho admin theo studentId
const getRecommendationsByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    const resp = await buildAchievementResponse(studentId);
    const recommendationsPayload = buildRecommendationsFromResponse(resp);
    return res.status(200).json(recommendationsPayload);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy achievement theo studentId dành cho admin (dùng cho trang chi tiết)
const getAchievementByStudentIdAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    await AchievementProfile.findOrCreate({
      where: { studentId },
      defaults: { studentId },
    });

    const resp = await buildAchievementResponse(studentId);
    return res.status(200).json(resp);
  } catch (error) {
    console.error("Error getting achievement by studentId (admin):", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Hàm tính toán thống kê và đề xuất (SQL, ghi về profile + trả về object)
const calculateAchievementStatsSQL = async (studentId, yearlyAchievements) => {
  const totalYears = yearlyAchievements.length;
  const totalAdvancedSoldier = yearlyAchievements.filter(
    (a) => a.title === "Chiến sĩ tiên tiến"
  ).length;
  const totalCompetitiveSoldier = yearlyAchievements.filter(
    (a) => a.title === "Chiến sĩ thi đua"
  ).length;

  let totalTopics = 0;
  let totalInitiatives = 0;
  yearlyAchievements.forEach((y) => {
    totalTopics += (y.scientific.topics || []).filter(
      (t) => t.status === "approved"
    ).length;
    totalInitiatives += (y.scientific.initiatives || []).filter(
      (i) => i.status === "approved"
    ).length;
  });

  // Sắp xếp theo năm tăng dần
  const sortedAchievements = [...yearlyAchievements].sort(
    (a, b) => a.year - b.year
  );

  // Helper: Kiểm tra năm có NCKH đã duyệt không
  const hasApprovedResearch = (achievement) => {
    const approvedCount =
      (achievement.scientific?.topics || []).filter(
        (t) => t.status === "approved"
      ).length +
      (achievement.scientific?.initiatives || []).filter(
        (i) => i.status === "approved"
      ).length;
    return approvedCount > 0;
  };

  // Tìm chuỗi CSTĐ liên tiếp THỰC SỰ (có tính việc CSTT sẽ reset chuỗi)
  // Logic: Nếu năm N có CSTĐ và năm N+1 có CSTT thì chuỗi bị reset
  let currentStreak = [];
  let bestStreakForBKBQP = []; // Chuỗi 2 năm CSTĐ + cả 2 năm có NCKH
  let bestStreakForCSTDTQ = []; // Chuỗi dẫn đến CSTĐTQ

  for (let i = 0; i < sortedAchievements.length; i++) {
    const current = sortedAchievements[i];
    const prev = i > 0 ? sortedAchievements[i - 1] : null;

    if (current.title === "Chiến sĩ thi đua") {
      // Kiểm tra có phải năm liên tiếp không
      if (prev && prev.year === current.year - 1) {
        if (prev.title === "Chiến sĩ thi đua") {
          // Năm trước cũng là CSTĐ → tiếp tục chuỗi
          currentStreak.push(current);
        } else {
          // Năm trước là CSTT → Reset chuỗi vì bị gián đoạn
          currentStreak = [current];
        }
      } else if (!prev || prev.year !== current.year - 1) {
        // Không có năm liền trước hoặc không liên tiếp → bắt đầu chuỗi mới
        currentStreak = [current];
      }

      // Kiểm tra điều kiện BK BQP: 2 năm CSTĐ liên tiếp + MỖI năm có NCKH đã duyệt
      if (currentStreak.length >= 2) {
        const lastTwo = currentStreak.slice(-2);
        const bothHaveResearch =
          hasApprovedResearch(lastTwo[0]) && hasApprovedResearch(lastTwo[1]);
        if (bothHaveResearch && lastTwo.length > bestStreakForBKBQP.length) {
          bestStreakForBKBQP = [...lastTwo];
        }
      }
    } else {
      // Năm có CSTT → Reset chuỗi CSTĐ liên tiếp
      currentStreak = [];
    }
  }

  // Tính số năm CSTĐ liên tiếp hiện tại (từ năm gần nhất)
  let maxConsecutiveCompetitive = 0;
  let consecutiveStartYear = 0;
  let latestStreak = [];

  // Đi ngược từ năm mới nhất để tìm chuỗi hiện tại
  for (let i = sortedAchievements.length - 1; i >= 0; i--) {
    const current = sortedAchievements[i];
    const next = i < sortedAchievements.length - 1 ? sortedAchievements[i + 1] : null;

    if (current.title === "Chiến sĩ thi đua") {
      if (!next || next.year === current.year + 1) {
        if (next && next.title !== "Chiến sĩ thi đua") {
          // Năm sau là CSTT → chuỗi bị gián đoạn tại đây
          break;
        }
        latestStreak.unshift(current);
        consecutiveStartYear = current.year;
      } else {
        break;
      }
    } else {
      // Gặp CSTT → dừng
      break;
    }
  }

  maxConsecutiveCompetitive = latestStreak.length;

  // Kiểm tra đã nhận BK BQP chưa
  const hasMinistryReward = yearlyAchievements.some((a) => a.hasMinistryReward);

  // Năm được phép nhận BK BQP = năm ngay sau 2 năm CSTĐ liên tiếp (có NCKH mỗi năm)
  // Ví dụ: 2022 CSTĐ+NCKH, 2023 CSTĐ+NCKH → BK BQP chỉ được set cho năm 2024
  // Năm nhận BK BQP không cần có CSTĐ hay NCKH, chỉ cần 2 năm trước đủ
  const eligibleMinistryRewardYear = bestStreakForBKBQP.length >= 2
    ? bestStreakForBKBQP[1].year + 1
    : 0;

  // Điều kiện BK BQP: 2 năm CSTĐ liên tiếp + MỖI năm có NCKH đã duyệt
  // Không cần kiểm tra gì ở năm nhận BK BQP
  const eligibleForMinistryReward =
    !hasMinistryReward &&
    bestStreakForBKBQP.length >= 2;

  // Điều kiện CSTĐ Toàn Quân:
  // 1. Phải có BK BQP trước
  // 2. Năm nhận BK BQP phải có CSTĐ + NCKH đã duyệt
  // 3. CSTĐ TQ chỉ được nhận vào năm NGAY SAU năm nhận BK BQP
  // 4. Nếu bỏ lỡ năm đó thì mất cơ hội
  let eligibleForNationalReward = false;
  let hasTopicInFirstYear = false;
  let hasTopicInSecondYear = false;
  let hasTopicInThirdYear = false;
  let ministryRewardYear = 0; // Năm nhận BK BQP
  let eligibleNationalRewardYear = 0; // Năm duy nhất được phép nhận CSTĐ TQ

  if (hasMinistryReward) {
    // Tìm năm nhận BK BQP
    const ministryRewardAchievement = yearlyAchievements.find(
      (a) => a.hasMinistryReward
    );
    if (ministryRewardAchievement) {
      ministryRewardYear = ministryRewardAchievement.year;
      // Năm được phép nhận CSTĐ TQ = năm sau năm nhận BK BQP
      eligibleNationalRewardYear = ministryRewardYear + 1;

      // Kiểm tra năm nhận BK BQP có CSTĐ + NCKH không
      const bkYearAchievement = yearlyAchievements.find(
        (a) => a.year === ministryRewardYear
      );

      // Kiểm tra đã nhận CSTĐ TQ chưa
      const hasNationalReward = yearlyAchievements.some((a) => a.hasNationalReward);

      // Kiểm tra đã có bản ghi cho năm eligibleNationalRewardYear chưa
      // Nếu có bản ghi cho năm đó mà không có CSTĐ TQ → đã bỏ lỡ
      const eligibleYearAchievement = yearlyAchievements.find(
        (a) => a.year === eligibleNationalRewardYear
      );
      const alreadyMissed = eligibleYearAchievement && !eligibleYearAchievement.hasNationalReward;

      if (
        bkYearAchievement &&
        bkYearAchievement.title === "Chiến sĩ thi đua" &&
        hasApprovedResearch(bkYearAchievement) &&
        !hasNationalReward &&
        !alreadyMissed
      ) {
        eligibleForNationalReward = true;
        hasTopicInSecondYear = true; // Năm nhận BK BQP
      }
    }
  }

  const secondYearOfStreak =
    bestStreakForBKBQP.length >= 2 ? bestStreakForBKBQP[1].year : 0;
  const thirdYearOfStreak = secondYearOfStreak + 1;

  const nextYear = yearlyAchievements.length
    ? Math.max(...yearlyAchievements.map((a) => a.year)) + 1
    : new Date().getFullYear();

  // Lấy năm CSTĐ gần nhất
  const competitiveSoldierYears = yearlyAchievements
    .filter((a) => a.title === "Chiến sĩ thi đua")
    .map((a) => a.year);
  const lastCompetitiveYear = Math.max(...competitiveSoldierYears, 0);

  // Kiểm tra năm gần nhất có phải CSTT không (đã reset chuỗi)
  const mostRecentYear = sortedAchievements.length
    ? sortedAchievements[sortedAchievements.length - 1]
    : null;
  const lastYearWasAdvanced =
    mostRecentYear && mostRecentYear.title === "Chiến sĩ tiên tiến";

  // Tính số năm CSTĐ cần để đủ điều kiện BK BQP
  // Nếu năm gần nhất là CSTT, chuỗi đã reset → cần 2 năm mới
  const yearsToMinistryReward = lastYearWasAdvanced
    ? 2
    : Math.max(0, 2 - maxConsecutiveCompetitive);

  // Lưu profile tổng hợp
  await AchievementProfile.upsert({
    studentId,
    totalYears,
    totalAdvancedSoldier,
    totalCompetitiveSoldier,
    totalScientificTopics: totalTopics,
    totalScientificInitiatives: totalInitiatives,
    eligibleForMinistryReward,
    eligibleForNationalReward,
  });

  return {
    totalYears,
    totalAdvancedSoldier,
    totalCompetitiveSoldier,
    totalScientificTopics: totalTopics,
    totalScientificInitiatives: totalInitiatives,
    eligibleForMinistryReward,
    eligibleForNationalReward,
    nextYearRecommendations: {
      needCompetitiveSoldier: !eligibleForMinistryReward,
      needScientificTopic: totalTopics === 0 && totalInitiatives === 0,
      yearsToMinistryReward,
      yearsToNationalReward: hasMinistryReward ? 0 : yearsToMinistryReward,
      consecutiveCompetitiveYears: maxConsecutiveCompetitive,
      lastCompetitiveYear,
      nextYear,
      lastYearWasAdvanced, // Chuỗi đã bị reset do năm gần nhất là CSTT
      canContinueStreak:
        !lastYearWasAdvanced &&
        nextYear === lastCompetitiveYear + 1 &&
        maxConsecutiveCompetitive < 2, // Chỉ cần 2 năm cho BK BQP
      // Thông tin chi tiết
      nationalRewardDetails: {
        hasTopicInFirstYear,
        hasTopicInSecondYear,
        hasTopicInThirdYear,
        hasMinistryReward,
        firstYearOfStreak: consecutiveStartYear,
        secondYearOfStreak,
        thirdYearOfStreak,
      },
      // Năm được phép chọn bằng khen
      eligibleYears: {
        ministryRewardYear: eligibleForMinistryReward ? eligibleMinistryRewardYear : 0,
        nationalRewardYear: eligibleForNationalReward ? eligibleNationalRewardYear : 0,
      },
      // Thông tin cho BK BQP
      eligibleMinistryRewardYear, // Năm duy nhất được phép nhận BK BQP
      // Thông tin cho CSTĐ TQ
      ministryRewardYear, // Năm đã nhận BK BQP
      eligibleNationalRewardYear, // Năm duy nhất được phép nhận CSTĐ TQ
    },
  };
};

// Helper: dựng payload đề xuất theo API cũ từ response đã tính
const buildRecommendationsFromResponse = (resp) => {
  const achievement = resp;
  const consecutiveYears = achievement.nextYearRecommendations?.consecutiveCompetitiveYears || 0;
  const details = achievement.nextYearRecommendations?.nationalRewardDetails || {};
  const hasScientific = achievement.totalScientificTopics > 0 || achievement.totalScientificInitiatives > 0;

  const recommendations = {
    currentStats: {
      totalYears: achievement.totalYears,
      totalAdvancedSoldier: achievement.totalAdvancedSoldier,
      totalCompetitiveSoldier: achievement.totalCompetitiveSoldier,
      totalScientificTopics: achievement.totalScientificTopics,
      totalScientificInitiatives: achievement.totalScientificInitiatives,
      consecutiveCompetitiveYears: consecutiveYears,
    },
    eligibleForMinistryReward: achievement.eligibleForMinistryReward,
    eligibleForNationalReward: achievement.eligibleForNationalReward,
    nextYearRecommendations: achievement.nextYearRecommendations,
    missingRequirements: {
      ministryReward: {
        needCompetitiveSoldier:
          achievement.nextYearRecommendations?.yearsToMinistryReward || 0,
        needScientificTopicPerYear: true, // Mỗi năm CSTĐ cần có NCKH
      },
      nationalReward: {
        needMinistryRewardFirst: !details.hasMinistryReward,
        needCompetitiveSoldierInBKYear: true, // Năm nhận BK cần có CSTĐ
        needScientificInBKYear: true, // Năm nhận BK cần có NCKH
      },
    },
  };

  // Kiểm tra đã nhận bằng khen chưa (dựa trên dữ liệu thực tế)
  const hasMinistryReward = (achievement.yearlyAchievements || []).some(
    (ya) => ya.hasMinistryReward === true
  );
  const hasNationalReward = (achievement.yearlyAchievements || []).some(
    (ya) => ya.hasNationalReward === true
  );

  const suggestions = [];

  // ========== XỬ LÝ THEO THỨ TỰ ƯU TIÊN ==========

  // 1. Nếu đã nhận CSTĐ Toàn quân → chỉ hiển thị thông báo này
  if (hasNationalReward) {
    suggestions.push("Đã nhận CSTĐ Toàn Quân");
    return { ...recommendations, suggestions };
  }

  // 2. Nếu đã nhận BK BQP → hướng dẫn tiến tới CSTĐ TQ
  if (hasMinistryReward) {
    if (achievement.eligibleForNationalReward) {
      suggestions.push("Đã đủ điều kiện nhận CSTĐ Toàn Quân");
    } else if (consecutiveYears >= 3) {
      // Đã có 3 năm liên tiếp, chỉ cần kiểm tra NCKH năm thứ 3
      // (Năm 1 và 2 chắc chắn đã có NCKH vì đó là điều kiện bắt buộc để nhận BK BQP)
      if (!details.hasTopicInThirdYear) {
        suggestions.push(`Đã có BK của Bộ trưởng BQP - Cần thêm: 1 đề tài/sáng kiến ở năm thứ 3 (${details.thirdYearOfStreak}) để đủ điều kiện nhận CSTĐ Toàn Quân`);
      } else {
        suggestions.push("Đã đủ điều kiện nhận CSTĐ Toàn Quân");
      }
    } else {
      // Chưa đủ 3 năm liên tiếp
      const yearsNeeded = 3 - consecutiveYears;
      suggestions.push(`Đã có BK của Bộ trưởng BQP - Cần thêm ${yearsNeeded} năm CSTĐ liên tiếp để đủ điều kiện nhận CSTĐ Toàn Quân`);
    }
    return { ...recommendations, suggestions };
  }

  // 3. Chưa có bằng khen nào → gợi ý dựa trên tiến độ

  // Kiểm tra chuỗi có bị reset do CSTT không
  const lastYearWasAdvanced =
    achievement.nextYearRecommendations?.lastYearWasAdvanced || false;

  // 3a. Đã đủ điều kiện BK BQP (2 năm CSTĐ liên tiếp + MỖI năm có NCKH đã duyệt)
  if (achievement.eligibleForMinistryReward) {
    suggestions.push("Đã đủ điều kiện nhận BK của Bộ trưởng BQP");
    return { ...recommendations, suggestions };
  }

  // 3b. Thành tích không được duy trì do năm gần nhất là CSTT
  if (lastYearWasAdvanced) {
    suggestions.push(
      "Thành tích CSTĐ liên tục không được duy trì do năm gần nhất cá nhân chỉ đạt Chiến sĩ tiên tiến"
    );
    suggestions.push(
      "Cần 2 năm CSTĐ liên tiếp (mỗi năm có NCKH đã duyệt) để đủ điều kiện nhận BK của Bộ trưởng BQP"
    );
    return { ...recommendations, suggestions };
  }

  // 3c. Có 1 năm CSTĐ
  if (consecutiveYears === 1) {
    suggestions.push(
      "Cần thêm 1 năm CSTĐ liên tiếp để đủ điều kiện nhận BK của Bộ trưởng BQP"
    );
    suggestions.push(
      "(Lưu ý: Cả 2 năm CSTĐ đều cần có NCKH đã duyệt)"
    );
    return { ...recommendations, suggestions };
  }

  // 3d. Có 2 năm CSTĐ liên tiếp nhưng chưa đủ NCKH ở cả 2 năm
  if (consecutiveYears >= 2 && !achievement.eligibleForMinistryReward) {
    suggestions.push(
      "Có 2 năm CSTĐ liên tiếp nhưng chưa đủ NCKH đã duyệt ở cả 2 năm"
    );
    suggestions.push(
      "Cần bổ sung NCKH được duyệt cho các năm CSTĐ còn thiếu"
    );
    return { ...recommendations, suggestions };
  }

  // 3e. Chưa có năm CSTĐ nào
  if (consecutiveYears === 0) {
    suggestions.push(
      "Cần đạt danh hiệu Chiến sĩ thi đua để bắt đầu hành trình khen thưởng"
    );
    suggestions.push(
      "Điều kiện BK của Bộ trưởng BQP: 2 năm CSTĐ liên tiếp + mỗi năm có NCKH đã duyệt"
    );
    return { ...recommendations, suggestions };
  }

  return { ...recommendations, suggestions };
};

module.exports = {
  getStudentAchievement,
  getAllAchievements,
  getStudentsForAdmin,
  addYearlyAchievement,
  addYearlyAchievementByAdmin,
  updateYearlyAchievement,
  updateYearlyAchievementByAdmin,
  deleteYearlyAchievement,
  deleteYearlyAchievementByAdmin,
  getRecommendations,
  getRecommendationsByStudentId,
  getAchievementByStudentIdAdmin,
};

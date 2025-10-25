const { Op } = require("sequelize");
const {
  User,
  Student,
  AchievementProfile,
  YearlyAchievement,
  ScientificInitiative,
  ScientificTopic,
} = require("../models");

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
    const { year, decisionNumber, decisionDate, title, scientific, notes } =
      req.body;

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

    // Tạo thông báo cho sinh viên khi khen thưởng được cập nhật
    try {
      const { Notification } = require("../models");
      const student = await Student.findByPk(ya.studentId);

      if (student) {
        const achievementTitle = payload.title || ya.title || "Khen thưởng";
        await Notification.create({
          studentId: ya.studentId,
          type: "achievement",
          title: "Cập nhật khen thưởng",
          message: `Khen thưởng "${achievementTitle}" năm ${ya.year} của bạn đã được cập nhật.`,
          data: JSON.stringify({
            achievementId: ya.id,
            year: ya.year,
            studentId: ya.studentId,
          }),
          read: false,
        });
        console.log(
          `✅ Created notification for student ${student.fullName} about achievement update`
        );
      }
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Không throw error để không ảnh hưởng đến việc cập nhật khen thưởng
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

    await YearlyAchievement.destroy({
      where: { studentId, year: parseInt(year) },
    });

    return res.status(200).json({ message: "Xóa khen thưởng thành công" });
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

    await YearlyAchievement.destroy({
      where: { id: achievementId },
    });

    return res.status(200).json({ message: "Xóa khen thưởng thành công" });
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

  const competitiveYears = yearlyAchievements
    .filter((a) => a.title === "Chiến sĩ thi đua")
    .map((a) => a.year)
    .sort((a, b) => a - b);

  // Tìm chuỗi CHÍNH XÁC 3 năm liên tiếp (không quá 3)
  let maxConsecutiveCompetitive = 0;
  let currentConsecutive = 0;
  let consecutiveStartYear = 0;
  let validThreeYearStreak = null; // Lưu chuỗi 3 năm hợp lệ cuối cùng

  for (let i = 0; i < competitiveYears.length; i++) {
    if (i === 0 || competitiveYears[i] === competitiveYears[i - 1] + 1) {
      if (currentConsecutive === 0) consecutiveStartYear = competitiveYears[i];
      currentConsecutive++;

      // Khi đạt 3 năm liên tiếp, lưu lại
      if (currentConsecutive === 3) {
        validThreeYearStreak = {
          startYear: consecutiveStartYear,
          endYear: competitiveYears[i],
        };
      }
      // Nếu quá 3 năm, reset để tìm chuỗi mới
      if (currentConsecutive > 3) {
        currentConsecutive = 1;
        consecutiveStartYear = competitiveYears[i];
        validThreeYearStreak = null; // Hủy chuỗi cũ vì đã quá 3 năm
      }
    } else {
      currentConsecutive = 1;
      consecutiveStartYear = competitiveYears[i];
    }
    maxConsecutiveCompetitive = Math.max(
      maxConsecutiveCompetitive,
      currentConsecutive
    );
  }

  // Nếu có chuỗi 3 năm hợp lệ, dùng nó
  if (validThreeYearStreak) {
    consecutiveStartYear = validThreeYearStreak.startYear;
  }

  const currentYear = yearlyAchievements.length
    ? Math.max(...yearlyAchievements.map((a) => a.year))
    : 0;
  const secondYearOfStreak = consecutiveStartYear + 1;
  const thirdYearOfStreak = consecutiveStartYear + 2;

  const eligibleForMinistryReward =
    maxConsecutiveCompetitive >= 2 &&
    currentYear >= secondYearOfStreak &&
    (totalTopics > 0 || totalInitiatives > 0);

  // CSTĐ Toàn quân: Cần có NCKH ở năm thứ 3 + NCKH ở 1 trong 2 năm trước đó
  let hasTopicInFirstYear = false;
  let hasTopicInSecondYear = false;
  let hasTopicInThirdYear = false;

  if (maxConsecutiveCompetitive >= 3) {
    yearlyAchievements.forEach((y) => {
      // Kiểm tra cả đề tài (topics) và sáng kiến (initiatives) đã duyệt
      const approvedCount =
        (y.scientific.topics || []).filter((t) => t.status === "approved")
          .length +
        (y.scientific.initiatives || []).filter((i) => i.status === "approved")
          .length;

      if (y.year === consecutiveStartYear && approvedCount > 0) {
        hasTopicInFirstYear = true;
      }
      if (y.year === secondYearOfStreak && approvedCount > 0) {
        hasTopicInSecondYear = true;
      }
      if (y.year === thirdYearOfStreak && approvedCount > 0) {
        hasTopicInThirdYear = true;
      }
    });
  }

  const eligibleForNationalReward =
    maxConsecutiveCompetitive >= 3 &&
    currentYear >= thirdYearOfStreak &&
    hasTopicInThirdYear &&
    (hasTopicInFirstYear || hasTopicInSecondYear);

  const nextYear = yearlyAchievements.length
    ? Math.max(...yearlyAchievements.map((a) => a.year)) + 1
    : new Date().getFullYear();
  const lastCompetitiveYear = Math.max(...competitiveYears, 0);

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
      needCompetitiveSoldier: maxConsecutiveCompetitive < 3,
      needScientificTopic: totalTopics === 0 && totalInitiatives === 0,
      yearsToMinistryReward: Math.max(0, 2 - maxConsecutiveCompetitive),
      yearsToNationalReward: Math.max(0, 3 - maxConsecutiveCompetitive),
      consecutiveCompetitiveYears: maxConsecutiveCompetitive,
      lastCompetitiveYear,
      nextYear,
      canContinueStreak:
        nextYear === lastCompetitiveYear + 1 &&
        maxConsecutiveCompetitive % 3 !== 0,
      // Thông tin chi tiết cho CSTĐ Toàn quân
      nationalRewardDetails: {
        hasTopicInFirstYear,
        hasTopicInSecondYear,
        hasTopicInThirdYear,
        firstYearOfStreak: consecutiveStartYear,
        secondYearOfStreak,
        thirdYearOfStreak,
      },
      // Năm được phép chọn bằng khen
      eligibleYears: {
        ministryRewardYear: secondYearOfStreak, // Chỉ năm thứ 2
        nationalRewardYear: thirdYearOfStreak,  // Chỉ năm thứ 3
      },
    },
  };
};

// Helper: dựng payload đề xuất theo API cũ từ response đã tính
const buildRecommendationsFromResponse = (resp) => {
  const achievement = resp; // giữ tên biến cũ để tái sử dụng logic

  const recommendations = {
    currentStats: {
      totalYears: achievement.totalYears,
      totalAdvancedSoldier: achievement.totalAdvancedSoldier,
      totalCompetitiveSoldier: achievement.totalCompetitiveSoldier,
      totalScientificTopics: achievement.totalScientificTopics,
      totalScientificInitiatives: achievement.totalScientificInitiatives,
      consecutiveCompetitiveYears:
        achievement.nextYearRecommendations.consecutiveCompetitiveYears,
    },
    eligibleForMinistryReward: achievement.eligibleForMinistryReward,
    eligibleForNationalReward: achievement.eligibleForNationalReward,
    nextYearRecommendations: achievement.nextYearRecommendations,
    missingRequirements: {
      ministryReward: {
        needCompetitiveSoldier: Math.max(
          0,
          2 - achievement.nextYearRecommendations.consecutiveCompetitiveYears
        ),
        needScientificTopic:
          achievement.totalScientificTopics === 0 &&
          achievement.totalScientificInitiatives === 0
            ? 1
            : 0,
      },
      nationalReward: {
        needCompetitiveSoldier: Math.max(
          0,
          3 - achievement.nextYearRecommendations.consecutiveCompetitiveYears
        ),
        needScientificTopic:
          achievement.totalScientificTopics === 0 &&
          achievement.totalScientificInitiatives === 0
            ? 1
            : 0,
      },
    },
  };

  const hasMinistryReward = (achievement.yearlyAchievements || []).some(
    (ya) => ya.hasMinistryReward
  );
  const hasNationalReward = (achievement.yearlyAchievements || []).some(
    (ya) => ya.hasNationalReward
  );

  const suggestions = [];
  if (
    achievement.totalCompetitiveSoldier === 1 &&
    (achievement.totalScientificTopics > 0 ||
      achievement.totalScientificInitiatives > 0)
  ) {
    suggestions.push(
      "Cần thêm 1 năm chiến sĩ thi đua để đủ điều kiện nhận bằng khen Bộ Quốc Phòng"
    );
  }
  if (
    achievement.nextYearRecommendations.consecutiveCompetitiveYears === 2 &&
    achievement.totalCompetitiveSoldier >= 2 &&
    achievement.totalScientificTopics === 0 &&
    achievement.totalScientificInitiatives === 0
  ) {
    suggestions.push(
      "Cần thêm 1 đề tài hoặc sáng kiến khoa học để đủ điều kiện nhận bằng khen Bộ Quốc Phòng"
    );
  }
  if (
    achievement.nextYearRecommendations.consecutiveCompetitiveYears === 2 &&
    achievement.totalCompetitiveSoldier >= 2 &&
    (achievement.totalScientificTopics > 0 ||
      achievement.totalScientificInitiatives > 0) &&
    !achievement.eligibleForMinistryReward
  ) {
    suggestions.push("Đã đủ điều kiện nhận bằng khen Bộ Quốc Phòng");
    if (achievement.nextYearRecommendations.yearsToNationalReward === 1) {
      suggestions.push(
        "Cần thêm 1 năm chiến sĩ thi đua để đủ điều kiện nhận CSTĐ Toàn Quân"
      );
    }
  }
  if (
    achievement.nextYearRecommendations.consecutiveCompetitiveYears === 2 &&
    achievement.totalCompetitiveSoldier >= 2 &&
    (achievement.totalScientificTopics > 0 ||
      achievement.totalScientificInitiatives > 0) &&
    achievement.eligibleForMinistryReward &&
    !achievement.eligibleForNationalReward
  ) {
    // Không push "Đã đủ điều kiện BK BQP" nếu đã có BK BQP
    if (!hasMinistryReward) {
      suggestions.push("Đã đủ điều kiện nhận bằng khen Bộ Quốc Phòng");
    }
    // Gợi ý cho CSTĐ Toàn quân sẽ được xử lý ở phần dưới
  }
  // Kiểm tra điều kiện CSTĐ Toàn quân với logic chi tiết
  if (
    achievement.nextYearRecommendations.consecutiveCompetitiveYears >= 3 &&
    !achievement.eligibleForNationalReward
  ) {
    const details =
      achievement.nextYearRecommendations.nationalRewardDetails || {};
    const missingRequirements = [];

    // Kiểm tra NCKH ở năm thứ 3
    if (!details.hasTopicInThirdYear) {
      missingRequirements.push(
        "1 đề tài/sáng kiến ở năm thứ 3 (" + details.thirdYearOfStreak + ")"
      );
    }

    // Kiểm tra NCKH ở 1 trong 2 năm trước
    if (!details.hasTopicInFirstYear && !details.hasTopicInSecondYear) {
      missingRequirements.push(
        "1 đề tài/sáng kiến ở năm " +
          details.firstYearOfStreak +
          " hoặc năm " +
          details.secondYearOfStreak
      );
    }

    if (missingRequirements.length > 0) {
      suggestions.push(
        "Đã có 3 năm chiến sĩ thi đua liên tiếp - Cần thêm: " +
          missingRequirements.join(" và ")
      );
    }
  }

  if (achievement.eligibleForNationalReward) {
    suggestions.push("Đã đủ điều kiện nhận CSTĐ Toàn Quân");
  }

  if (hasNationalReward) {
    suggestions.length = 0;
    suggestions.push("Đã nhận CSTĐ Toàn Quân");
  } else if (hasMinistryReward) {
    // Nếu đã có BK BQP, kiểm tra xem đã đủ 3 năm chưa
    if (achievement.nextYearRecommendations.consecutiveCompetitiveYears >= 3) {
      // Đã có 3 năm, chỉ cần kiểm tra NCKH
      const details =
        achievement.nextYearRecommendations.nationalRewardDetails || {};
      const missingRequirements = [];

      if (!details.hasTopicInThirdYear) {
        missingRequirements.push(
          "1 đề tài/sáng kiến ở năm thứ 3 (" + details.thirdYearOfStreak + ")"
        );
      }

      if (!details.hasTopicInFirstYear && !details.hasTopicInSecondYear) {
        missingRequirements.push(
          "1 đề tài/sáng kiến ở năm " +
            details.firstYearOfStreak +
            " hoặc năm " +
            details.secondYearOfStreak
        );
      }

      if (missingRequirements.length > 0) {
        suggestions.length = 0;
        suggestions.push(
          "Đã có bằng khen Bộ Quốc Phòng - Cần thêm: " +
            missingRequirements.join(" và ") +
            " để đủ điều kiện nhận CSTĐ Toàn Quân"
        );
      } else {
        suggestions.length = 0;
        suggestions.push("Đã đủ điều kiện nhận CSTĐ Toàn Quân");
      }
    } else {
      suggestions.length = 0;
      suggestions.push(
        "Đã có bằng khen Bộ Quốc Phòng - Cần thêm 1 năm chiến sĩ thi đua và 1 đề tài/sáng kiến khoa học để đủ điều kiện nhận CSTĐ Toàn Quân"
      );
    }
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

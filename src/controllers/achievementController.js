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

  // Map về structure cũ
  const yearlyAchievements = yearly.map((ya) => ({
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
        name: i.name,
        status: i.status,
      })),
      topics: (ya.scientific_topics || []).map((t) => ({
        id: t.id,
        name: t.name,
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
    const { userId } = req.params;

    const user = await User.findByPk(userId, { include: [Student] });
    if (!user || !user.student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Đảm bảo có AchievementProfile
    await AchievementProfile.findOrCreate({
      where: { studentId: user.student.id },
      defaults: { studentId: user.student.id },
    });

    const resp = await buildAchievementResponse(user.student.id);
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
    return res.status(200).json(students);
  } catch (error) {
    console.error("Error getting students:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm khen thưởng mới (theo user)
const addYearlyAchievement = async (req, res) => {
  try {
    const { userId } = req.params;
    const { year, decisionNumber, decisionDate, title, scientific, notes } =
      req.body;

    const user = await User.findByPk(userId, { include: [Student] });
    if (!user || !user.student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const studentId = user.student.id;

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
          name: i.name,
          status: i.status || "pending",
        }))
      );
    }
    if (scientific?.topics?.length) {
      await ScientificTopic.bulkCreate(
        scientific.topics.map((t) => ({
          yearlyAchievementId: created.id,
          name: t.name,
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
          name: i.name,
          status: i.status || "pending",
        }))
      );
    }
    if (scientific?.topics?.length) {
      await ScientificTopic.bulkCreate(
        scientific.topics.map((t) => ({
          yearlyAchievementId: created.id,
          name: t.name,
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
    const { userId, year } = req.params;
    const updateData = req.body;

    const user = await User.findByPk(userId, { include: [Student] });
    if (!user || !user.student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const studentId = user.student.id;
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
            name: i.name,
            status: i.status || "pending",
          }))
        );
      }
      if (updateData.scientific.topics?.length) {
        await ScientificTopic.bulkCreate(
          updateData.scientific.topics.map((t) => ({
            yearlyAchievementId: ya.id,
            name: t.name,
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

// Cập nhật khen thưởng cho admin
const updateYearlyAchievementByAdmin = async (req, res) => {
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

    if (updateData.scientific) {
      await ScientificInitiative.destroy({
        where: { yearlyAchievementId: ya.id },
      });
      await ScientificTopic.destroy({ where: { yearlyAchievementId: ya.id } });
      if (updateData.scientific.initiatives?.length) {
        await ScientificInitiative.bulkCreate(
          updateData.scientific.initiatives.map((i) => ({
            yearlyAchievementId: ya.id,
            name: i.name,
            status: i.status || "pending",
          }))
        );
      }
      if (updateData.scientific.topics?.length) {
        await ScientificTopic.bulkCreate(
          updateData.scientific.topics.map((t) => ({
            yearlyAchievementId: ya.id,
            name: t.name,
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

// Xóa khen thưởng
const deleteYearlyAchievement = async (req, res) => {
  try {
    const { userId, year } = req.params;

    const user = await User.findByPk(userId, { include: [Student] });
    if (!user || !user.student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const studentId = user.student.id;
    await YearlyAchievement.destroy({
      where: { studentId, year: parseInt(year) },
    });

    return res.status(200).json({ message: "Xóa khen thưởng thành công" });
  } catch (error) {
    console.error("Error deleting achievement:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa khen thưởng cho admin
const deleteYearlyAchievementByAdmin = async (req, res) => {
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

// Lấy đề xuất khen thưởng cho năm tiếp theo
const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, { include: [Student] });
    if (!user || !user.student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const resp = await buildAchievementResponse(user.student.id);

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

  let maxConsecutiveCompetitive = 0;
  let currentConsecutive = 0;
  let consecutiveStartYear = 0;
  for (let i = 0; i < competitiveYears.length; i++) {
    if (i === 0 || competitiveYears[i] === competitiveYears[i - 1] + 1) {
      if (currentConsecutive === 0) consecutiveStartYear = competitiveYears[i];
      currentConsecutive++;
    } else {
      currentConsecutive = 1;
      consecutiveStartYear = competitiveYears[i];
    }
    maxConsecutiveCompetitive = Math.max(
      maxConsecutiveCompetitive,
      currentConsecutive
    );
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

  const eligibleForNationalReward =
    maxConsecutiveCompetitive >= 3 &&
    currentYear >= thirdYearOfStreak &&
    (totalTopics > 0 || totalInitiatives > 0);

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
    suggestions.push("Đã đủ điều kiện nhận bằng khen Bộ Quốc Phòng");
    if (achievement.nextYearRecommendations.yearsToNationalReward === 1) {
      suggestions.push(
        "Cần thêm 1 năm chiến sĩ thi đua để đủ điều kiện nhận CSTĐ Toàn Quân"
      );
    }
  }
  if (
    achievement.nextYearRecommendations.consecutiveCompetitiveYears > 0 &&
    achievement.nextYearRecommendations.consecutiveCompetitiveYears % 3 === 0 &&
    achievement.totalScientificTopics === 0 &&
    achievement.totalScientificInitiatives === 0 &&
    !achievement.eligibleForNationalReward
  ) {
    suggestions.push(
      "Cần có đề tài hoặc sáng kiến khoa học để đủ điều kiện nhận CSTĐ Toàn Quân"
    );
  }
  if (achievement.eligibleForNationalReward) {
    suggestions.push("Đã đủ điều kiện nhận CSTĐ Toàn Quân");
  }

  if (hasNationalReward) {
    suggestions.length = 0;
    suggestions.push("Đã có CSTĐ Toàn Quân - Không cần đề xuất thêm");
  } else if (hasMinistryReward) {
    suggestions.length = 0;
    suggestions.push(
      "Đã có bằng khen Bộ Quốc Phòng - Cần thêm 1 năm chiến sĩ thi đua để đủ điều kiện nhận CSTĐ Toàn Quân"
    );
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

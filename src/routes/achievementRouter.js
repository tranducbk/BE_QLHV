const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middlewares/verify");
const {
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
} = require("../controllers/achievementController");

// Routes cho admin
// Lấy danh sách tất cả achievement
router.get("/admin/all", verifyToken, isAdmin, getAllAchievements);

// Lấy danh sách học viên cho admin
router.get("/admin/students", verifyToken, isAdmin, getStudentsForAdmin);

// Lấy recommendations cho admin theo studentId
router.get(
  "/admin/:studentId/recommendations",
  verifyToken,
  isAdmin,
  getRecommendationsByStudentId
);

// Lấy achievement của 1 học viên cho admin (xem chi tiết)
router.get(
  "/admin/:studentId",
  verifyToken,
  isAdmin,
  require("../controllers/achievementController").getAchievementByStudentIdAdmin
);

// Thêm khen thưởng cho học viên (admin)
router.post(
  "/admin/:studentId",
  verifyToken,
  isAdmin,
  addYearlyAchievementByAdmin
);

// Cập nhật khen thưởng cho học viên (admin)
router.put(
  "/admin/:studentId/:year",
  verifyToken,
  isAdmin,
  updateYearlyAchievementByAdmin
);

// Xóa khen thưởng cho học viên (admin)
router.delete(
  "/admin/:studentId/:year",
  verifyToken,
  isAdmin,
  deleteYearlyAchievementByAdmin
);

// Routes cho học viên
// Lấy thông tin khen thưởng của student
router.get("/:studentId", verifyToken, getStudentAchievement);

// Lấy đề xuất khen thưởng cho năm tiếp theo
router.get("/:studentId/recommendations", verifyToken, getRecommendations);

// Thêm khen thưởng mới
router.post("/:studentId", verifyToken, addYearlyAchievement);

// Cập nhật khen thưởng theo năm
router.put("/:studentId/:year", verifyToken, updateYearlyAchievement);

// Xóa khen thưởng theo năm
router.delete("/:studentId/:year", verifyToken, deleteYearlyAchievement);

module.exports = router;

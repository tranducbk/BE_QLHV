const router = require("express").Router();
const { verifyToken } = require("../middlewares/verify");
const { optionalVerify } = require("../middlewares/optionalVerify");
const {
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
} = require("../controllers/gradeController");
const {
  uploadGradeFile,
  getGradeFile,
  uploadFileMiddleware,
} = require("../controllers/gradeFileController");

router.post("/upload-file", verifyToken, uploadFileMiddleware, uploadGradeFile);

// Route xem file - không yêu cầu authentication (optional) để có thể mở trong tab mới
router.get("/file/:fileName", optionalVerify, getGradeFile);

router.get("/:userId", verifyToken, getStudentGrades);

router.get("/:userId/:semester/:schoolYear", verifyToken, getSemesterGrades);

// Thêm kết quả học tập cho học kỳ (theo userId)
router.post("/:userId", verifyToken, addSemesterGrades);

// Cập nhật kết quả học tập cho học kỳ (theo userId)
router.put("/:userId/:semester/:schoolYear", verifyToken, updateSemesterGrades);

// Xóa kết quả học tập cho học kỳ (theo userId)
router.delete(
  "/:userId/:semester/:schoolYear",
  verifyToken,
  deleteSemesterGrades
);

// Xóa kết quả học tập theo ID (để tương thích với frontend cũ)
router.delete("/:userId/learn/:learnId", verifyToken, deleteSemesterGradesById);

// Xóa kết quả năm học
router.delete("/:userId/yearly/:schoolYear", verifyToken, deleteYearlyResult);

// Tính toán lại CPA cho tất cả các năm học
router.post(
  "/:userId/recalculate",
  verifyToken,
  recalculateAllYearlyResultsAPI
);

// ===== ROUTES CHO ADMIN (sử dụng studentId) =====

// Lấy kết quả học tập theo học kỳ (theo studentId) - cho admin
router.get(
  "/student/:studentId/:semester/:schoolYear",
  verifyToken,
  getSemesterGradesByStudentId
);

// ===== UTILITY ROUTES =====

// Lấy thông tin điểm
router.get("/info/:letterGrade", verifyToken, getGradeInfo);

// Chuyển đổi điểm
router.post("/convert", verifyToken, convertGrade);

// Tính điểm trung bình
router.post("/calculate-average", verifyToken, calculateAverage);

module.exports = router;

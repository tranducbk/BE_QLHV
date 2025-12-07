const router = require("express").Router();
const { verifyToken, isAdmin } = require("../middlewares/verify");
const {
  getPendingGrades,
  getAllGradesWithStatus,
  approveGrade,
  bulkApproveGrades,
  bulkRejectGrades,
  rejectGrade,
  getGradeStatusCounts,
} = require("../controllers/gradeApprovalController");

// ===== ROUTES CHO QUẢN LÝ PHÊ DUYỆT KẾT QUẢ HỌC TẬP (CHỈ ADMIN) =====

// Lấy số lượng kết quả theo trạng thái
router.get("/counts", verifyToken, isAdmin, getGradeStatusCounts);

// Lấy danh sách kết quả chờ duyệt
router.get("/pending", verifyToken, isAdmin, getPendingGrades);

// Lấy tất cả kết quả với trạng thái (có filter)
router.get("/all", verifyToken, isAdmin, getAllGradesWithStatus);

// Phê duyệt một đề xuất
router.post(
  "/approve/:proposalId",
  verifyToken,
  isAdmin,
  approveGrade
);

// Phê duyệt nhiều đề xuất cùng lúc
router.post("/approve-bulk", verifyToken, isAdmin, bulkApproveGrades);

// Từ chối nhiều đề xuất cùng lúc
router.post("/reject-bulk", verifyToken, isAdmin, bulkRejectGrades);

// Từ chối đề xuất
router.post(
  "/reject/:proposalId",
  verifyToken,
  isAdmin,
  rejectGrade
);

module.exports = router;

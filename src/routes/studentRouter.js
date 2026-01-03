const router = require("express").Router();
const { verifyToken } = require("../middlewares/verify");
const {
  getAllStudentsWithHierarchy,
  updateStudent,
  getStudent,
  addTuitionFee,
  getAchievement,
  getCutRice,
  createCutRice,
  updateCutRice,
  deleteCutRice,
  getTuitionFee,
  deleteTuitionFee,
  updateTuitionFee,
  createAutoCutRice,
  updateAutoCutRice,
  resetAutoCutRice,
  updateManualCutRice,
  debugCutRice, // Thêm import
  // CRUD cho thông tin người thân
  addFamilyMember,
  getFamilyMembers,
  updateFamilyMember,
  deleteFamilyMember,
  // CRUD cho mối quan hệ nước ngoài
  addForeignRelation,
  getForeignRelations,
  updateForeignRelation,
  deleteForeignRelation,
  // CRUD cho xếp loại Đảng viên
  addPartyRating,
  getPartyRatings,
  updatePartyRating,
  deletePartyRating,
  // CRUD cho xếp loại rèn luyện
  addTrainingRating,
  getTrainingRatings,
  updateTrainingRating,
  deleteTrainingRating,
  // Grade functions
  getStudentGradesByStudentId,
  getSemesterGradesByStudentId,
  addSemesterGradesByStudentId,
  deleteSemesterGradesByStudentId,
  requestUpdateApprovedGrades,
  requestDeleteApprovedGrades,
} = require("../controllers/studentController");

// Import từ các controller đã tách
const {
  getTimeTable,
  createTimeTable,
  deleteTimeTable,
  updateTimeTable,
} = require("../controllers/timeTableController");

const {
  getUniversityHierarchy,
  getOrganizationsByUniversity,
  getEducationLevelsByOrganization,
  getClassesByEducationLevel,
  createOrganization,
  createEducationLevel,
  createClass,
  updateOrganization,
  updateEducationLevel,
  updateClass,
  deleteOrganization,
  deleteEducationLevel,
  deleteClass,
} = require("../controllers/universityController");

// Student routes
router.get("/all", verifyToken, getAllStudentsWithHierarchy);

// Helper route: Get student by userId (for backward compatibility)
router.get("/by-user/:userId", verifyToken, async (req, res) => {
  try {
    const {
      User,
      Student,
      University,
      Organization,
      EducationLevel,
      ClassModel,
    } = require("../models");

    const user = await User.findByPk(req.params.userId, {
      include: [
        {
          model: Student,
          include: [
            {
              model: University,
              attributes: ["id", "universityCode", "universityName"],
            },
            {
              model: Organization,
              attributes: ["id", "organizationName", "travelTime"],
            },
            { model: EducationLevel, attributes: ["id", "levelName"] },
            { model: ClassModel, attributes: ["id", "className"] },
          ],
        },
      ],
    });

    if (!user || !user.student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Đảm bảo familyMembers và foreignRelations được trả về
    const studentJson = user.student.toJSON();
    const studentData = {
      ...studentJson,
      familyMembers: user.student.familyMembers || [],
      foreignRelations: user.student.foreignRelations || [],
      // Đổi tên field từ education_level sang educationLevel để đồng nhất với frontend
      educationLevel: studentJson.education_level || studentJson.educationLevel,
    };

    // Xóa field education_level cũ để tránh trùng lặp
    if (studentData.education_level) {
      delete studentData.education_level;
    }

    return res.status(200).json(studentData);
  } catch (error) {
    console.error("Error in /by-user/:userId:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.get("/:studentId", verifyToken, getStudent);
router.put("/:studentId", verifyToken, updateStudent);
router.get("/:studentId/achievement", verifyToken, getAchievement);

//CRUD with time_table
router.get("/:studentId/time-table", verifyToken, getTimeTable);
router.post("/:studentId/time-table", verifyToken, createTimeTable);
router.delete(
  "/:studentId/time-table/:scheduleId",
  verifyToken,
  deleteTimeTable
);
router.put("/:studentId/time-table/:scheduleId", verifyToken, updateTimeTable);

//CRUD with tuitionFee
router.get("/:studentId/tuition-fee", verifyToken, getTuitionFee);
router.post("/:studentId/tuition-fee", verifyToken, addTuitionFee);
router.delete("/:studentId/tuitionFee/:feeId", verifyToken, deleteTuitionFee);
router.put("/:studentId/tuitionFee/:tuitionFeeId", verifyToken, updateTuitionFee);

// CRUD with cutRice
router.get("/:studentId/cut-rice", verifyToken, getCutRice);
router.put("/:studentId/cut-rice/:cutRiceId", verifyToken, updateCutRice);
router.post("/:studentId/cut-rice", verifyToken, createCutRice);
router.delete("/:studentId/cut-rice/:cutRiceId", verifyToken, deleteCutRice);

// Auto cut rice routes
router.post("/:studentId/auto-cut-rice", verifyToken, createAutoCutRice);
router.put("/:studentId/auto-cut-rice", verifyToken, updateAutoCutRice);
router.put("/:studentId/reset-cut-rice", verifyToken, resetAutoCutRice);
router.put("/:studentId/manual-cut-rice", verifyToken, updateManualCutRice);

// Debug route để kiểm tra lịch cắt cơm
router.get("/:studentId/debug-cut-rice", verifyToken, debugCutRice);

// University hierarchy
router.get(
  "/university/:universityId/hierarchy",
  verifyToken,
  getUniversityHierarchy
);

// Organization routes
router.get(
  "/university/:universityId/organizations",
  verifyToken,
  getOrganizationsByUniversity
);
router.post("/organizations", verifyToken, createOrganization);
router.put("/organizations/:organizationId", verifyToken, updateOrganization);
router.delete(
  "/organizations/:organizationId",
  verifyToken,
  deleteOrganization
);

// Education Level routes
router.get(
  "/organizations/:organizationId/education-levels",
  verifyToken,
  getEducationLevelsByOrganization
);
router.post("/education-levels", verifyToken, createEducationLevel);
router.put(
  "/education-levels/:educationLevelId",
  verifyToken,
  updateEducationLevel
);
router.delete(
  "/education-levels/:educationLevelId",
  verifyToken,
  deleteEducationLevel
);

// Class routes
router.get(
  "/education-levels/:educationLevelId/classes",
  verifyToken,
  getClassesByEducationLevel
);
router.post("/classes", verifyToken, createClass);
router.put("/classes/:classId", verifyToken, updateClass);
router.delete("/classes/:classId", verifyToken, deleteClass);

// ===== ROUTES CHO THÔNG TIN NGƯỜI THÂN =====
router.post("/:studentId/family-members", verifyToken, addFamilyMember);
router.get("/:studentId/family-members", verifyToken, getFamilyMembers);
router.put(
  "/:studentId/family-members/:familyMemberId",
  verifyToken,
  updateFamilyMember
);
router.delete(
  "/:studentId/family-members/:familyMemberId",
  verifyToken,
  deleteFamilyMember
);

// ===== ROUTES CHO MỐI QUAN HỆ NƯỚC NGOÀI =====
router.post("/:studentId/foreign-relations", verifyToken, addForeignRelation);
router.get("/:studentId/foreign-relations", verifyToken, getForeignRelations);
router.put(
  "/:studentId/foreign-relations/:foreignRelationId",
  verifyToken,
  updateForeignRelation
);
router.delete(
  "/:studentId/foreign-relations/:foreignRelationId",
  verifyToken,
  deleteForeignRelation
);

// ===== ROUTES CHO XẾP LOẠI Đảng viên =====
router.post("/:studentId/party-ratings", verifyToken, addPartyRating);
router.get("/:studentId/party-ratings", verifyToken, getPartyRatings);
router.put(
  "/:studentId/party-ratings/:partyRatingId",
  verifyToken,
  updatePartyRating
);
router.delete(
  "/:studentId/party-ratings/:partyRatingId",
  verifyToken,
  deletePartyRating
);

// ===== ROUTES CHO XẾP LOẠI RÈN LUYỆN =====
router.post("/:studentId/training-ratings", verifyToken, addTrainingRating);
router.get("/:studentId/training-ratings", verifyToken, getTrainingRatings);
router.put(
  "/:studentId/training-ratings/:trainingRatingId",
  verifyToken,
  updateTrainingRating
);
router.delete(
  "/:studentId/training-ratings/:trainingRatingId",
  verifyToken,
  deleteTrainingRating
);

// ===== ROUTES CHO KẾT QUẢ HỌC TẬP (GRADE) =====
// Lấy kết quả học tập của sinh viên
router.get("/:studentId/grades", verifyToken, getStudentGradesByStudentId);

// Lấy kết quả học tập theo học kỳ
router.get(
  "/:studentId/grades/:semester/:schoolYear",
  verifyToken,
  getSemesterGradesByStudentId
);

// Thêm kết quả học tập cho học kỳ
router.post("/:studentId/grades", verifyToken, addSemesterGradesByStudentId);

// Xóa đề xuất theo proposalId (phải đặt trước route semester/schoolYear để tránh conflict)
router.delete(
  "/:studentId/grades/proposal/:proposalId",
  verifyToken,
  deleteSemesterGradesByStudentId
);

// Xóa đề xuất kết quả học tập cho học kỳ (đề xuất PENDING hoặc REJECTED)
// Fallback: xóa bằng semester/schoolYear nếu không có proposalId
router.delete(
  "/:studentId/grades/:semester/:schoolYear",
  verifyToken,
  deleteSemesterGradesByStudentId
);

// Yêu cầu CẬP NHẬT kết quả học tập đã duyệt (tạo đề xuất UPDATE)
router.post(
  "/:studentId/grades/:semester/:schoolYear/request-update",
  verifyToken,
  requestUpdateApprovedGrades
);

// Yêu cầu XÓA kết quả học tập đã duyệt (tạo đề xuất DELETE)
router.post(
  "/:studentId/grades/:semester/:schoolYear/request-delete",
  verifyToken,
  requestDeleteApprovedGrades
);

module.exports = router;

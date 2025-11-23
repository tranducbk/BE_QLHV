const { Op } = require("sequelize");
const {
  Student,
  University,
  Organization,
  EducationLevel,
  ClassModel,
  User,
  CutRice,
  TuitionFee,
  TimeTable,
} = require("../models");

// Helper function để kiểm tra quyền truy cập
const checkStudentAccess = async (req, studentId) => {
  const requestingUserId = req.user?.id;
  const user = await User.findByPk(requestingUserId);

  if (!user) {
    return { allowed: false, message: "Không tìm thấy thông tin người dùng" };
  }

  // Chỉ cho phép truy cập dữ liệu của chính mình (trừ SUPER_ADMIN có thể truy cập tất cả)
  if (user.studentId !== studentId && req.user?.role !== "SUPER_ADMIN") {
    return {
      allowed: false,
      message: "Bạn chỉ có thể truy cập dữ liệu của chính mình",
    };
  }

  return { allowed: true };
};
const classService = require("../services/classService");
const autoCutRiceService = require("../services/autoCutRiceService");
const crypto = require("crypto");

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Student ID
 *         studentCode:
 *           type: string
 *           description: Student code
 *         fullName:
 *           type: string
 *           description: Full name
 *         email:
 *           type: string
 *           description: Email
 *         phoneNumber:
 *           type: string
 *           description: Phone number
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Date of birth
 *         gender:
 *           type: string
 *           description: Gender
 *         address:
 *           type: string
 *           description: Address
 *         universityId:
 *           type: string
 *           description: University ID
 *         organizationId:
 *           type: string
 *           description: Organization ID
 *         educationLevelId:
 *           type: string
 *           description: Education level ID
 *         classId:
 *           type: string
 *           description: Class ID
 *         enrollmentYear:
 *           type: integer
 *           description: Enrollment year
 *         graduationDate:
 *           type: string
 *           format: date
 *           description: Graduation date
 *         isGraduated:
 *           type: boolean
 *           description: Is graduated
 */

/**
 * @swagger
 * /student/all:
 *   get:
 *     summary: Lấy danh sách tất cả sinh viên
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       500:
 *         description: Lỗi server
 */
const getAllStudentsWithHierarchy = async (req, res) => {
  try {
    const students = await Student.findAll({
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
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Kiểm tra quyền truy cập - chỉ cho phép xem thông tin của chính mình
    const requestingUserId = req.user?.id;
    const user = await User.findByPk(requestingUserId);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng" });
    }

    // Chỉ cho phép xem thông tin của chính mình (trừ SUPER_ADMIN có thể xem tất cả)
    if (user.studentId !== studentId && req.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Bạn chỉ có thể xem thông tin của chính mình",
      });
    }

    const student = await Student.findByPk(studentId, {
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
    });

    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Đảm bảo familyMembers và foreignRelations được trả về
    const studentJson = student.toJSON();
    const studentData = {
      ...studentJson,
      familyMembers: student.familyMembers || [],
      foreignRelations: student.foreignRelations || [],
      // Đổi tên field từ education_level sang educationLevel để đồng nhất với frontend
      educationLevel: studentJson.education_level || studentJson.educationLevel,
    };

    // Xóa field education_level cũ để tránh trùng lặp
    if (studentData.education_level) {
      delete studentData.education_level;
    }

    res.status(200).json(studentData);
  } catch (error) {
    return res.status(500).json(error);
  }
};

const updateStudent = async (req, res) => {
  try {
    const {
      studentId: newStudentId,
      fullName,
      gender,
      birthday,
      hometown,
      ethnicity,
      religion,
      currentAddress,
      placeOfBirth,
      phoneNumber,
      email,
      cccdNumber,
      partyMemberCardNumber,
      enrollment,
      graduationDate,
      class: classId,
      educationLevel,
      organization,
      university,
      unit,
      rank,
      positionGovernment,
      positionParty,
      fullPartyMember,
      probationaryPartyMember,
      dateOfEnlistment,
      avatar,
      familyMembers,
      foreignRelations,
    } = req.body;

    const updateData = {
      studentId: newStudentId,
      fullName,
      gender,
      birthday,
      hometown,
      ethnicity,
      religion,
      currentAddress,
      placeOfBirth,
      phoneNumber,
      email,
      cccdNumber,
      partyMemberCardNumber,
      enrollment,
      graduationDate,
      class: classId,
      educationLevel,
      organization,
      university,
      unit,
      rank,
      positionGovernment,
      positionParty,
      fullPartyMember,
      probationaryPartyMember,
      dateOfEnlistment,
      avatar,
    };

    // Thêm thông tin gia đình nếu có
    if (familyMembers && Array.isArray(familyMembers)) {
      updateData.familyMembers = familyMembers;
    }

    // Thêm thông tin yếu tố nước ngoài nếu có
    if (foreignRelations && Array.isArray(foreignRelations)) {
      updateData.foreignRelations = foreignRelations;
    }

    const student = await Student.findByPk(req.params.studentId);
    if (!student) return res.status(404).json("Không tìm thấy sinh viên");

    // Lưu classId cũ để kiểm tra chuyển lớp
    const oldClassId = student.classId;

    await student.update({
      studentId: newStudentId,
      fullName,
      gender,
      birthday,
      hometown,
      ethnicity,
      religion,
      currentAddress,
      placeOfBirth,
      phoneNumber,
      email,
      cccdNumber,
      partyMemberCardNumber,
      enrollment,
      graduationDate,
      classId,
      educationLevelId: educationLevel,
      organizationId: organization,
      universityId: university,
      unit,
      rank,
      positionGovernment,
      positionParty,
      fullPartyMember,
      probationaryPartyMember,
      dateOfEnlistment,
      avatar,
      familyMembers: familyMembers || student.familyMembers || [],
      foreignRelations: foreignRelations || student.foreignRelations || [],
    });

    // Cập nhật số lượng sinh viên nếu có chuyển lớp
    if (oldClassId !== classId) {
      await classService.transferStudentClass(oldClassId, classId);
    }

    const updatedStudent = await Student.findByPk(req.params.studentId, {
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
    });

    // Transform field name từ education_level sang educationLevel
    const studentJson = updatedStudent.toJSON();
    const responseData = {
      ...studentJson,
      educationLevel: studentJson.education_level || studentJson.educationLevel,
    };

    if (responseData.education_level) {
      delete responseData.education_level;
    }

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json("Lỗi server");
  }
};

const getTuitionFee = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Kiểm tra quyền truy cập
    const accessCheck = await checkStudentAccess(req, studentId);
    if (!accessCheck.allowed) {
      return res.status(403).json({ message: accessCheck.message });
    }

    const where = { studentId };
    if (req.query.semester) where.semester = String(req.query.semester);
    const fees = await TuitionFee.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(fees);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const addTuitionFee = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, schoolYear } = req.body;

    // Kiểm tra quyền truy cập
    const accessCheck = await checkStudentAccess(req, studentId);
    if (!accessCheck.allowed) {
      return res.status(403).json({ message: accessCheck.message });
    }

    // Kiểm tra trùng học kỳ + năm học
    if (semester && schoolYear) {
      const existingFee = await TuitionFee.findOne({
        where: {
          studentId,
          semester,
          schoolYear,
        },
      });

      if (existingFee) {
        return res.status(400).json({
          message: `Học phí cho ${semester} - ${schoolYear} đã tồn tại. Vui lòng xóa học phí cũ trước khi thêm mới.`,
        });
      }
    }

    const created = await TuitionFee.create({
      studentId,
      totalAmount: req.body.totalAmount,
      semester: req.body.semester,
      schoolYear: req.body.schoolYear,
      content: req.body.content,
      status: req.body.status,
    });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getAchievement = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    return res.status(200).json(student.achievement);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getCutRice = async (req, res) => {
  try {
    const { studentId } = req.params;

    const record = await CutRice.findOne({
      where: { studentId },
      order: [["createdAt", "DESC"]], // Lấy record mới nhất
    });

    const emptyWeekly = {
      monday: { breakfast: false, lunch: false, dinner: false },
      tuesday: { breakfast: false, lunch: false, dinner: false },
      wednesday: { breakfast: false, lunch: false, dinner: false },
      thursday: { breakfast: false, lunch: false, dinner: false },
      friday: { breakfast: false, lunch: false, dinner: false },
      saturday: { breakfast: false, lunch: false, dinner: false },
      sunday: { breakfast: false, lunch: false, dinner: false },
    };

    if (record) {
      // Trả về dữ liệu từ database (sử dụng field weekly)
      const cutRiceData = {
        monday: record.weekly?.monday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        tuesday: record.weekly?.tuesday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        wednesday: record.weekly?.wednesday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        thursday: record.weekly?.thursday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        friday: record.weekly?.friday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        saturday: record.weekly?.saturday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
        sunday: record.weekly?.sunday || {
          breakfast: false,
          lunch: false,
          dinner: false,
        },
      };
      return res.status(200).json(cutRiceData);
    } else {
      // Nếu không có record, trả về lịch trống
      return res.status(200).json(emptyWeekly);
    }
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const createCutRice = async (req, res) => {
  try {
    const { studentId } = req.params;

    const weekly = req.body;
    const record = await CutRice.create({
      studentId,
      weekly,
      isAutoGenerated: false,
      lastUpdated: new Date(),
      notes: "Lịch cắt cơm thủ công",
    });
    return res.status(201).json(record.weekly);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Tạo lịch cắt cơm tự động
const createAutoCutRice = async (req, res) => {
  try {
    const { studentId } = req.params;

    const cutRiceSchedule = await autoCutRiceService.updateAutoCutRice(
      studentId
    );

    return res.status(201).json({
      message: "Tạo lịch cắt cơm tự động thành công",
      schedule: cutRiceSchedule,
    });
  } catch (error) {
    console.error("Error creating auto cut rice:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật lịch cắt cơm tự động
const updateAutoCutRice = async (req, res) => {
  try {
    const { studentId } = req.params;

    const cutRiceSchedule = await autoCutRiceService.updateAutoCutRice(
      studentId
    );

    return res.status(200).json({
      message: "Cập nhật lịch cắt cơm tự động thành công",
      schedule: cutRiceSchedule,
    });
  } catch (error) {
    console.error("Error updating auto cut rice:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Reset về lịch cắt cơm tự động
const resetAutoCutRice = async (req, res) => {
  try {
    const { studentId } = req.params;

    const cutRiceSchedule = await autoCutRiceService.resetToAutoCutRice(
      studentId
    );

    return res.status(200).json({
      message: "Đã reset về lịch cắt cơm tự động",
      schedule: cutRiceSchedule,
    });
  } catch (error) {
    console.error("Error resetting auto cut rice:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật lịch cắt cơm thủ công (admin)
const updateManualCutRice = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { cutRiceData } = req.body;

    const [record, created] = await CutRice.findOrCreate({
      where: { studentId },
      defaults: { weekly: cutRiceData, isAutoGenerated: false },
    });
    if (!created) {
      await record.update({
        weekly: cutRiceData,
        isAutoGenerated: false,
        lastUpdated: new Date(),
        notes: "Chỉnh sửa thủ công bởi admin",
      });
    }
    return res.status(200).json({
      message: "Cập nhật lịch cắt cơm thủ công thành công",
      schedule: record.weekly,
    });
  } catch (error) {
    console.error("Error updating manual cut rice:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const updateCutRice = async (req, res) => {
  try {
    const { studentId } = req.params;
    const record = await CutRice.findOne({
      where: { studentId },
    });
    if (!record) {
      const created = await CutRice.create({
        studentId,
        weekly: req.body,
        isAutoGenerated: false,
        lastUpdated: new Date(),
        notes: "Lịch cắt cơm thủ công",
      });
      return res.status(200).json(created.weekly);
    }
    await record.update({
      weekly: req.body,
      isAutoGenerated: false,
      lastUpdated: new Date(),
    });
    return res.status(200).json(record.weekly);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteCutRice = async (req, res) => {
  try {
    const { studentId, cutRiceId } = req.params;
    const destroyed = await CutRice.destroy({
      where: { id: cutRiceId, studentId },
    });
    if (!destroyed)
      return res.status(404).json({ message: "cutRice không tồn tại" });
    return res.status(200).json({ message: "Xóa lịch cắt cơm thành công" });
  } catch (error) {
    console.error("Error deleting cutRice:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const deleteTuitionFee = async (req, res) => {
  try {
    const { studentId, feeId } = req.params;
    const destroyed = await TuitionFee.destroy({
      where: { id: feeId, studentId },
    });
    if (!destroyed)
      return res.status(404).json({ message: "Không tìm thấy học phí" });
    return res
      .status(200)
      .json({ message: "Tuition fee đã được xóa thành công" });
  } catch (error) {
    return res.status(500).json("Lỗi server");
  }
};

const updateTuitionFee = async (req, res) => {
  try {
    const { studentId, tuitionFeeId } = req.params;
    const fee = await TuitionFee.findByPk(tuitionFeeId);
    if (!fee || fee.studentId !== studentId)
      return res.status(404).json({ message: "tuitionFee không tồn tại" });

    // Kiểm tra quyền truy cập
    const accessCheck = await checkStudentAccess(req, studentId);
    if (!accessCheck.allowed) {
      return res.status(403).json({ message: accessCheck.message });
    }

    // Kiểm tra nếu học phí đã thanh toán thì không cho cập nhật
    const status = String(fee.status || "").toLowerCase();
    if (status.includes("đã thanh toán") || status.includes("đã đóng")) {
      return res.status(400).json({
        message: "Không thể cập nhật học phí đã thanh toán. Vui lòng xóa và tạo mới nếu cần.",
      });
    }

    // Kiểm tra trùng học kỳ + năm học (nếu có thay đổi)
    const { semester, schoolYear } = req.body;
    if (semester && schoolYear) {
      const existingFee = await TuitionFee.findOne({
        where: {
          studentId,
          semester,
          schoolYear,
          id: { [Op.ne]: tuitionFeeId }, // Loại trừ học phí đang sửa
        },
      });

      if (existingFee) {
        return res.status(400).json({
          message: `Học phí cho ${semester} - ${schoolYear} đã tồn tại. Vui lòng xóa học phí trùng trước khi cập nhật.`,
        });
      }
    }

    await fee.update(req.body);
    return res.status(200).json(fee);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Debug function để kiểm tra lịch cắt cơm
const debugCutRice = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Lấy thông tin timeTable từ model mới
    const timeTable = await TimeTable.findOne({
      where: { studentId },
    });
    const scheduleCount = timeTable ? timeTable.schedules.length : 0;

    return res.status(200).json({
      studentId: student.id,
      fullName: student.fullName,
      cutRiceCount: student.cutRice.length,
      cutRice: student.cutRice,
      timeTableCount: scheduleCount,
      timeTable,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// ===== CRUD CHO THÔNG TIN NGƯỜI THÂN =====

// Thêm thông tin người thân
const addFamilyMember = async (req, res) => {
  try {
    const { studentId } = req.params;
    const familyMemberData = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    // Thêm ID cho family member
    const newFamilyMember = {
      id: crypto.randomUUID(),
      ...familyMemberData,
    };

    // Lấy danh sách family members hiện tại
    const currentFamilyMembers = student.familyMembers || [];
    currentFamilyMembers.push(newFamilyMember);

    // Cập nhật student
    await student.update({ familyMembers: currentFamilyMembers });

    res.status(201).json({
      message: "Thêm thông tin người thân thành công",
      familyMember: newFamilyMember,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách thông tin người thân
const getFamilyMembers = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    res.status(200).json({
      familyMembers: student.familyMembers || [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin người thân
const updateFamilyMember = async (req, res) => {
  try {
    const { studentId, familyMemberId } = req.params;
    const updateData = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    const currentFamilyMembers = student.familyMembers || [];
    const familyMemberIndex = currentFamilyMembers.findIndex(
      (member) => member.id === familyMemberId
    );

    if (familyMemberIndex === -1) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin người thân" });
    }

    // Cập nhật thông tin
    currentFamilyMembers[familyMemberIndex] = {
      ...currentFamilyMembers[familyMemberIndex],
      ...updateData,
    };

    await student.update({ familyMembers: currentFamilyMembers });

    res.status(200).json({
      message: "Cập nhật thông tin người thân thành công",
      familyMember: currentFamilyMembers[familyMemberIndex],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa thông tin người thân
const deleteFamilyMember = async (req, res) => {
  try {
    const { studentId, familyMemberId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    const currentFamilyMembers = student.familyMembers || [];
    const familyMemberIndex = currentFamilyMembers.findIndex(
      (member) => member.id === familyMemberId
    );

    if (familyMemberIndex === -1) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin người thân" });
    }

    // Xóa family member
    currentFamilyMembers.splice(familyMemberIndex, 1);
    await student.update({ familyMembers: currentFamilyMembers });

    res.status(200).json({
      message: "Xóa thông tin người thân thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== CRUD CHO MỐI QUAN HỆ NƯỚC NGOÀI =====

// Thêm mối quan hệ nước ngoài
const addForeignRelation = async (req, res) => {
  try {
    const { studentId } = req.params;
    const foreignRelationData = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    // Thêm ID cho foreign relation
    const newForeignRelation = {
      id: crypto.randomUUID(),
      ...foreignRelationData,
    };

    // Lấy danh sách foreign relations hiện tại
    const currentForeignRelations = student.foreignRelations || [];
    currentForeignRelations.push(newForeignRelation);

    // Cập nhật student
    await student.update({ foreignRelations: currentForeignRelations });

    res.status(201).json({
      message: "Thêm mối quan hệ nước ngoài thành công",
      foreignRelation: newForeignRelation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách mối quan hệ nước ngoài
const getForeignRelations = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    res.status(200).json({
      foreignRelations: student.foreignRelations || [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật mối quan hệ nước ngoài
const updateForeignRelation = async (req, res) => {
  try {
    const { studentId, foreignRelationId } = req.params;
    const updateData = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    const currentForeignRelations = student.foreignRelations || [];
    const foreignRelationIndex = currentForeignRelations.findIndex(
      (relation) => relation.id === foreignRelationId
    );

    if (foreignRelationIndex === -1) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy mối quan hệ nước ngoài" });
    }

    // Cập nhật thông tin
    currentForeignRelations[foreignRelationIndex] = {
      ...currentForeignRelations[foreignRelationIndex],
      ...updateData,
    };

    await student.update({ foreignRelations: currentForeignRelations });

    res.status(200).json({
      message: "Cập nhật mối quan hệ nước ngoài thành công",
      foreignRelation: currentForeignRelations[foreignRelationIndex],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa mối quan hệ nước ngoài
const deleteForeignRelation = async (req, res) => {
  try {
    const { studentId, foreignRelationId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    const currentForeignRelations = student.foreignRelations || [];
    const foreignRelationIndex = currentForeignRelations.findIndex(
      (relation) => relation.id === foreignRelationId
    );

    if (foreignRelationIndex === -1) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy mối quan hệ nước ngoài" });
    }

    // Xóa foreign relation
    currentForeignRelations.splice(foreignRelationIndex, 1);
    await student.update({ foreignRelations: currentForeignRelations });

    res.status(200).json({
      message: "Xóa mối quan hệ nước ngoài thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== CRUD CHO XẾP LOẠI Đảng viên =====

// Thêm xếp loại Đảng viên
const addPartyRating = async (req, res) => {
  try {
    const { studentId } = req.params;
    const partyRatingData = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    student.partyRatings.push(partyRatingData);
    await student.update(student.toJSON());

    res.status(201).json({
      message: "Thêm xếp loại Đảng viên thành công",
      partyRating: partyRatingData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách xếp loại Đảng viên
const getPartyRatings = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    res.status(200).json({
      partyRatings: student.partyRatings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật xếp loại Đảng viên
const updatePartyRating = async (req, res) => {
  try {
    const { studentId, partyRatingId } = req.params;
    const updateData = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    const partyRating = student.partyRatings.id(partyRatingId);
    if (!partyRating) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy xếp loại Đảng viên" });
    }

    Object.assign(partyRating, updateData);
    await student.update(student.toJSON());

    res.status(200).json({
      message: "Cập nhật xếp loại Đảng viên thành công",
      partyRating,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa xếp loại Đảng viên
const deletePartyRating = async (req, res) => {
  try {
    const { studentId, partyRatingId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    const partyRating = student.partyRatings.id(partyRatingId);
    if (!partyRating) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy xếp loại Đảng viên" });
    }

    partyRating.remove();
    await student.update(student.toJSON());

    res.status(200).json({
      message: "Xóa xếp loại Đảng viên thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== CRUD CHO XẾP LOẠI RÈN LUYỆN =====

// Thêm xếp loại rèn luyện
const addTrainingRating = async (req, res) => {
  try {
    const { studentId } = req.params;
    const trainingRatingData = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    student.trainingRatings.push(trainingRatingData);
    await student.update(student.toJSON());

    res.status(201).json({
      message: "Thêm xếp loại rèn luyện thành công",
      trainingRating: trainingRatingData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách xếp loại rèn luyện
const getTrainingRatings = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    res.status(200).json({
      trainingRatings: student.trainingRatings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật xếp loại rèn luyện
const updateTrainingRating = async (req, res) => {
  try {
    const { studentId, trainingRatingId } = req.params;
    const updateData = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    const trainingRating = student.trainingRatings.id(trainingRatingId);
    if (!trainingRating) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy xếp loại rèn luyện" });
    }

    Object.assign(trainingRating, updateData);
    await student.update(student.toJSON());

    res.status(200).json({
      message: "Cập nhật xếp loại rèn luyện thành công",
      trainingRating,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa xếp loại rèn luyện
const deleteTrainingRating = async (req, res) => {
  try {
    const { studentId, trainingRatingId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học viên" });
    }

    const trainingRating = student.trainingRatings.id(trainingRatingId);
    if (!trainingRating) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy xếp loại rèn luyện" });
    }

    trainingRating.remove();
    await student.update(student.toJSON());

    res.status(200).json({
      message: "Xóa xếp loại rèn luyện thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStudentsWithHierarchy,
  updateStudent,
  getStudent,
  addTuitionFee,
  getAchievement,
  getCutRice,
  createCutRice,
  createAutoCutRice,
  updateAutoCutRice,
  resetAutoCutRice,
  updateManualCutRice,
  updateCutRice,
  deleteCutRice,
  getTuitionFee,
  deleteTuitionFee,
  updateTuitionFee,
  debugCutRice, // Thêm function debug
  addFamilyMember,
  getFamilyMembers,
  updateFamilyMember,
  deleteFamilyMember,
  addForeignRelation,
  getForeignRelations,
  updateForeignRelation,
  deleteForeignRelation,
  addPartyRating,
  getPartyRatings,
  updatePartyRating,
  deletePartyRating,
  addTrainingRating,
  getTrainingRatings,
  updateTrainingRating,
  deleteTrainingRating,
};

// Import Grade functions from gradeController
const {
  getStudentGradesByStudentId,
  getSemesterGradesByStudentId,
  addSemesterGradesByStudentId,
  updateSemesterGradesByStudentId,
  deleteSemesterGradesByStudentId,
} = require("./gradeController");

module.exports = {
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
  debugCutRice, // Thêm function debug
  addFamilyMember,
  getFamilyMembers,
  updateFamilyMember,
  deleteFamilyMember,
  addForeignRelation,
  getForeignRelations,
  updateForeignRelation,
  deleteForeignRelation,
  addPartyRating,
  getPartyRatings,
  updatePartyRating,
  deletePartyRating,
  addTrainingRating,
  getTrainingRatings,
  updateTrainingRating,
  deleteTrainingRating,
  // Grade functions
  getStudentGradesByStudentId,
  getSemesterGradesByStudentId,
  addSemesterGradesByStudentId,
  updateSemesterGradesByStudentId,
  deleteSemesterGradesByStudentId,
};

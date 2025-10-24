const { ClassModel, Student } = require("../models");

// Cập nhật số lượng sinh viên trong lớp
const updateClassStudentCount = async (classId) => {
  try {
    // Đếm số sinh viên trong lớp
    const studentCount = await Student.count({ where: { classId: classId } });

    // Cập nhật số lượng sinh viên trong lớp
    await ClassModel.update(
      {
        studentCount: studentCount,
        updatedAt: new Date(),
      },
      { where: { id: classId } }
    );

    return studentCount;
  } catch (error) {
    console.error("Error updating class student count:", error);
    throw error;
  }
};

// Cập nhật số lượng sinh viên cho tất cả lớp
const updateAllClassesStudentCount = async () => {
  try {
    const classes = await ClassModel.findAll();

    for (const classItem of classes) {
      await updateClassStudentCount(classItem.id);
    }

  } catch (error) {
    console.error("Error updating all classes student count:", error);
    throw error;
  }
};

// Cập nhật số lượng sinh viên khi thêm sinh viên vào lớp
const addStudentToClass = async (classId) => {
  try {
    const classItem = await ClassModel.findByPk(classId);
    if (!classItem) {
      throw new Error("Class not found");
    }

    // Tăng số lượng sinh viên
    await ClassModel.update(
      {
        studentCount: classItem.studentCount + 1,
        updatedAt: new Date(),
      },
      { where: { id: classId } }
    );

      `Added student to class ${classId}, new count: ${
        classItem.studentCount + 1
      }`
    );
  } catch (error) {
    console.error("Error adding student to class:", error);
    throw error;
  }
};

// Cập nhật số lượng sinh viên khi xóa sinh viên khỏi lớp
const removeStudentFromClass = async (classId) => {
  try {
    const classItem = await ClassModel.findByPk(classId);
    if (!classItem) {
      throw new Error("Class not found");
    }

    // Giảm số lượng sinh viên (không âm)
    const newCount = Math.max(0, classItem.studentCount - 1);
    await ClassModel.update(
      {
        studentCount: newCount,
        updatedAt: new Date(),
      },
      { where: { id: classId } }
    );

      `Removed student from class ${classId}, new count: ${newCount}`
    );
  } catch (error) {
    console.error("Error removing student from class:", error);
    throw error;
  }
};

// Cập nhật số lượng sinh viên khi chuyển lớp
const transferStudentClass = async (oldClassId, newClassId) => {
  try {
    // Giảm số lượng sinh viên ở lớp cũ
    if (oldClassId) {
      await removeStudentFromClass(oldClassId);
    }

    // Tăng số lượng sinh viên ở lớp mới
    if (newClassId) {
      await addStudentToClass(newClassId);
    }

      `Transferred student from class ${oldClassId} to ${newClassId}`
    );
  } catch (error) {
    console.error("Error transferring student class:", error);
    throw error;
  }
};

module.exports = {
  updateClassStudentCount,
  updateAllClassesStudentCount,
  addStudentToClass,
  removeStudentFromClass,
  transferStudentClass,
};

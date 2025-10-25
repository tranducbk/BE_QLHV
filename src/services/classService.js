const { ClassModel, Student } = require("../models");

const updateClassStudentCount = async (classId) => {
  const studentCount = await Student.count({ where: { classId: classId } });

  await ClassModel.update(
    {
      studentCount: studentCount,
      updatedAt: new Date(),
    },
    { where: { id: classId } }
  );
  return studentCount;
};

const updateAllClassesStudentCount = async () => {
  const classes = await ClassModel.findAll();

  for (const classItem of classes) {
    await updateClassStudentCount(classItem.id);
  }
};

const addStudentToClass = async (classId) => {
  const classItem = await ClassModel.findByPk(classId);
  if (!classItem) {
    throw new Error("Class not found");
  }

  await ClassModel.update(
    {
      studentCount: classItem.studentCount + 1,
      updatedAt: new Date(),
    },
    { where: { id: classId } }
  );
};

const removeStudentFromClass = async (classId) => {
  const classItem = await ClassModel.findByPk(classId);
  if (!classItem) {
    throw new Error("Class not found");
  }

  const newCount = Math.max(0, classItem.studentCount - 1);
  await ClassModel.update(
    {
      studentCount: newCount,
      updatedAt: new Date(),
    },
    { where: { id: classId } }
  );
};

const transferStudentClass = async (oldClassId, newClassId) => {
  if (oldClassId) {
    await removeStudentFromClass(oldClassId);
  }

  if (newClassId) {
    await addStudentToClass(newClassId);
  }
};

module.exports = {
  updateClassStudentCount,
  updateAllClassesStudentCount,
  addStudentToClass,
  removeStudentFromClass,
  transferStudentClass,
};

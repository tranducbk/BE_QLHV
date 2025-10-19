const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const SemesterResult = sequelize.define(
  "semester_results",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: { type: DataTypes.UUID, allowNull: false },
    semester: { type: DataTypes.STRING, allowNull: false }, // HK1/HK2/HK3
    schoolYear: { type: DataTypes.STRING, allowNull: false },
    yearlyResultId: { type: DataTypes.UUID, allowNull: true },
    totalCredits: { type: DataTypes.INTEGER, defaultValue: 0 },
    averageGrade4: { type: DataTypes.FLOAT, defaultValue: 0 },
    averageGrade10: { type: DataTypes.FLOAT, defaultValue: 0 },
    cumulativeCredits: { type: DataTypes.INTEGER, defaultValue: 0 },
    cumulativeGrade4: { type: DataTypes.FLOAT, defaultValue: 0 },
    cumulativeGrade10: { type: DataTypes.FLOAT, defaultValue: 0 },
    debtCredits: { type: DataTypes.INTEGER, defaultValue: 0 },
    failedSubjects: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "semester_results",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["studentId", "semester", "schoolYear"] },
    ],
  }
);

module.exports = SemesterResult;

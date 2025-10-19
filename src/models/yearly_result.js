const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const YearlyResult = sequelize.define(
  "yearly_results",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: { type: DataTypes.UUID, allowNull: false },
    schoolYear: { type: DataTypes.STRING, allowNull: false },
    averageGrade4: { type: DataTypes.FLOAT, defaultValue: 0 },
    averageGrade10: { type: DataTypes.FLOAT, defaultValue: 0 },
    cumulativeGrade4: { type: DataTypes.FLOAT, defaultValue: 0 },
    cumulativeGrade10: { type: DataTypes.FLOAT, defaultValue: 0 },
    cumulativeCredits: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalCredits: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalSubjects: { type: DataTypes.INTEGER, defaultValue: 0 },
    passedSubjects: { type: DataTypes.INTEGER, defaultValue: 0 },
    failedSubjects: { type: DataTypes.INTEGER, defaultValue: 0 },
    debtCredits: { type: DataTypes.INTEGER, defaultValue: 0 },
    academicStatus: { type: DataTypes.STRING },
    studentLevel: { type: DataTypes.INTEGER, defaultValue: 1 },
    semesterIds: { type: DataTypes.ARRAY(DataTypes.UUID), defaultValue: [] },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "yearly_results",
    timestamps: true,
    indexes: [{ unique: true, fields: ["studentId", "schoolYear"] }],
  }
);

module.exports = YearlyResult;

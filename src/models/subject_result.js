const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const SubjectResult = sequelize.define(
  "subject_results",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    semesterResultId: { type: DataTypes.UUID, allowNull: false },
    subjectCode: { type: DataTypes.STRING, allowNull: false },
    subjectName: { type: DataTypes.STRING, allowNull: false },
    credits: { type: DataTypes.INTEGER, allowNull: false },
    letterGrade: { type: DataTypes.STRING, allowNull: false },
    gradePoint4: { type: DataTypes.FLOAT, allowNull: false },
    gradePoint10: { type: DataTypes.FLOAT, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "subject_results", timestamps: true }
);

module.exports = SubjectResult;

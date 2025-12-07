const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const GradeProposal = sequelize.define(
  "grade_proposals",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: { type: DataTypes.UUID, allowNull: false },
    semester: { type: DataTypes.STRING, allowNull: false },
    schoolYear: { type: DataTypes.STRING, allowNull: false },
    proposalType: {
      type: DataTypes.STRING(50),
      defaultValue: "CREATE", // CREATE, UPDATE, DELETE
    },
    totalCredits: { type: DataTypes.INTEGER, defaultValue: 0 },
    averageGrade4: { type: DataTypes.FLOAT, defaultValue: 0 },
    averageGrade10: { type: DataTypes.FLOAT, defaultValue: 0 },
    cumulativeCredits: { type: DataTypes.INTEGER, defaultValue: 0 },
    cumulativeGrade4: { type: DataTypes.FLOAT, defaultValue: 0 },
    cumulativeGrade10: { type: DataTypes.FLOAT, defaultValue: 0 },
    debtCredits: { type: DataTypes.INTEGER, defaultValue: 0 },
    failedSubjects: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: "PENDING", // PENDING, APPROVED, REJECTED
    },
    adminNote: { type: DataTypes.TEXT, allowNull: true },
    approvedBy: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "grade_proposals",
    timestamps: true,
  }
);

module.exports = GradeProposal;

const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const YearlyAchievement = sequelize.define(
  "yearly_achievements",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: { type: DataTypes.UUID, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    decisionNumber: { type: DataTypes.STRING, allowNull: true },
    decisionDate: { type: DataTypes.DATE, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: false },
    hasMinistryReward: { type: DataTypes.BOOLEAN, defaultValue: false },
    hasNationalReward: { type: DataTypes.BOOLEAN, defaultValue: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "yearly_achievements", timestamps: true }
);

module.exports = YearlyAchievement;

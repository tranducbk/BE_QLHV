const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const AchievementProfile = sequelize.define(
  "achievement_profiles",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: { type: DataTypes.UUID, allowNull: false, unique: true },
    totalYears: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalAdvancedSoldier: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalCompetitiveSoldier: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalScientificTopics: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalScientificInitiatives: { type: DataTypes.INTEGER, defaultValue: 0 },
    eligibleForMinistryReward: { type: DataTypes.BOOLEAN, defaultValue: false },
    eligibleForNationalReward: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "achievement_profiles", timestamps: true }
);

module.exports = AchievementProfile;

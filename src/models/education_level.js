const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const EducationLevel = sequelize.define(
  "education_levels",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    levelName: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "education_levels", timestamps: true }
);

module.exports = EducationLevel;

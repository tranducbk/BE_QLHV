const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const University = sequelize.define(
  "universities",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    universityCode: { type: DataTypes.STRING, allowNull: false, unique: true },
    universityName: { type: DataTypes.STRING, allowNull: false },
    totalStudents: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "universities", timestamps: true }
);

module.exports = University;

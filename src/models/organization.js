const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const Organization = sequelize.define(
  "organizations",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organizationName: { type: DataTypes.STRING, allowNull: false },
    travelTime: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 45 },
    totalStudents: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "organizations", timestamps: true }
);

module.exports = Organization;

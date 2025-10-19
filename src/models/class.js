const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const ClassModel = sequelize.define(
  "classes",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    className: { type: DataTypes.STRING, allowNull: false },
    studentCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "classes", timestamps: true }
);

module.exports = ClassModel;

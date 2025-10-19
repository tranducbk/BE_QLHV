const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const TimeTable = sequelize.define(
  "time_tables",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: { type: DataTypes.UUID, allowNull: false },
    // schedules JSON giữ cấu trúc lịch học
    schedules: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "time_tables", timestamps: true }
);

module.exports = TimeTable;

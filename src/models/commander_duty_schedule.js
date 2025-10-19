const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const CommanderDutySchedule = sequelize.define(
  "CommanderDutySchedule",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rank: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    workDay: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "commander_duty_schedules",
    timestamps: true,
  }
);

module.exports = CommanderDutySchedule;

const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const CommanderDutySchedule = sequelize.define(
  "CommanderDutySchedule",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    commanderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "commanders",
        key: "id",
      },
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

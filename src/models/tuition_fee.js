const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const TuitionFee = sequelize.define(
  "tuition_fees",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: { type: DataTypes.UUID, allowNull: false },
    totalAmount: { type: DataTypes.INTEGER, allowNull: false },
    semester: { type: DataTypes.STRING, allowNull: true },
    schoolYear: { type: DataTypes.STRING, allowNull: true },
    content: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "tuition_fees", timestamps: true }
);

module.exports = TuitionFee;

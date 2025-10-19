const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const SemesterSql = sequelize.define(
  "semesters",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: { type: DataTypes.STRING, allowNull: false },
    schoolYear: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "semesters",
    timestamps: true,
    indexes: [{ unique: true, fields: ["code", "schoolYear"] }],
  }
);

module.exports = SemesterSql;

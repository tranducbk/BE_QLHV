const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const UserSql = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
    studentId: { type: DataTypes.UUID, allowNull: true },
    commanderId: { type: DataTypes.UUID, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "users", timestamps: true, paranoid: false }
);

module.exports = UserSql;

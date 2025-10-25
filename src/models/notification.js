const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const Notification = sequelize.define(
  "notifications",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: true }, // "new_semester", "update_info", "tuition_fee", "party_rating", "training_rating"
    link: { type: DataTypes.STRING, allowNull: true }, // URL to navigate when clicked
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "notifications", timestamps: true }
);

module.exports = Notification;

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
    studentId: { type: DataTypes.UUID, allowNull: true }, // Cho thông báo đến student
    userId: { type: DataTypes.UUID, allowNull: true }, // Cho thông báo đến user (admin/student)
    targetRole: { type: DataTypes.STRING, allowNull: true }, // "ADMIN" hoặc "USER" - để filter thông báo
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: true }, // "new_semester", "update_info", "tuition_fee", "party_rating", "training_rating", "grade_proposal", "grade_approved", "grade_rejected"
    link: { type: DataTypes.STRING, allowNull: true }, // URL to navigate when clicked
    relatedId: { type: DataTypes.UUID, allowNull: true }, // ID liên quan (semesterResultId, studentId, etc.)
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "notifications", timestamps: true }
);

module.exports = Notification;

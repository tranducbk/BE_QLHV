const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const Student = sequelize.define(
  "students",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: { type: DataTypes.STRING, unique: true },
    fullName: { type: DataTypes.STRING },
    gender: DataTypes.STRING,
    birthday: DataTypes.DATE,
    hometown: DataTypes.STRING,
    ethnicity: DataTypes.STRING,
    religion: DataTypes.STRING,
    currentAddress: DataTypes.STRING,
    placeOfBirth: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    email: DataTypes.STRING,
    cccdNumber: DataTypes.STRING,
    partyMemberCardNumber: DataTypes.STRING,
    enrollment: DataTypes.INTEGER,
    graduationDate: DataTypes.DATE,
    unit: DataTypes.STRING,
    rank: DataTypes.STRING,
    positionGovernment: DataTypes.STRING,
    positionParty: DataTypes.STRING,
    fullPartyMember: DataTypes.DATE,
    probationaryPartyMember: DataTypes.DATE,
    dateOfEnlistment: DataTypes.DATE,
    avatar: {
      type: DataTypes.STRING,
      defaultValue:
        "https://i.pinimg.com/736x/81/09/3a/81093a0429e25b0ff579fa41aa96c421.jpg",
    },
    currentCpa4: { type: DataTypes.FLOAT, defaultValue: 0 },
    currentCpa10: { type: DataTypes.FLOAT, defaultValue: 0 },
    familyMembers: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    foreignRelations: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "students", timestamps: true }
);

module.exports = Student;

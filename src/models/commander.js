const { DataTypes } = require("sequelize");
const { sequelize } = require("../services/sequelize");

const Commander = sequelize.define(
  "commanders",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    commanderId: DataTypes.STRING,
    fullName: DataTypes.STRING,
    gender: DataTypes.STRING,
    birthday: DataTypes.DATE,
    placeOfBirth: DataTypes.STRING,
    hometown: DataTypes.STRING,
    ethnicity: DataTypes.STRING,
    religion: DataTypes.STRING,
    currentAddress: DataTypes.STRING,
    email: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    cccd: DataTypes.STRING,
    partyCardNumber: DataTypes.STRING,
    startWork: DataTypes.INTEGER,
    organization: DataTypes.STRING,
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
        "https://i.pinimg.com/736x/d4/a1/ff/d4a1ff9d0f243e50062e2b21f2f2496d.jpg",
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "commanders", timestamps: true }
);

module.exports = Commander;

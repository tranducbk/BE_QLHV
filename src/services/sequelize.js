const { Sequelize } = require("sequelize");
const { PG_HOST, DATABASE_URL } = require("../configs");

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function connectPostgreSQL() {
  try {
    await sequelize.authenticate();
    console.log("Đã kết nối tới PostgreSQL");
  } catch (error) {
    console.error("Lỗi kết nối PostgreSQL:", error?.message || error);
  }
}

module.exports = { sequelize, connectPostgreSQL };

const { Sequelize } = require("sequelize");
const {
  PG_HOST,
  PG_PORT,
  PG_DATABASE,
  PG_USER,
  PG_PASSWORD,
} = require("../configs");

const sequelize = new Sequelize(PG_DATABASE, PG_USER, PG_PASSWORD, {
  host: PG_HOST,
  port: PG_PORT,
  dialect: "postgres",
  logging: false,
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

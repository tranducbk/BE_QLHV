const { sequelize } = require("./sequelize");
// load associations
require("../models");

async function syncModels() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Đồng bộ models Sequelize thành công");
  } catch (error) {
    console.error("Lỗi đồng bộ models Sequelize:", error?.message || error);
  }
}

module.exports = { syncModels };

const { sequelize } = require("./sequelize");
// load associations
require("../models");

async function syncModels() {
  try {
    // Không sync với alter: true vì nó sẽ tạo lại constraints không mong muốn
    // Database schema được quản lý bởi Prisma
    // await sequelize.sync({ alter: true });
    console.log(
      "Sequelize models loaded (không sync để tránh tạo lại constraints)"
    );
  } catch (error) {
    console.error("Lỗi load models Sequelize:", error?.message || error);
  }
}

module.exports = { syncModels };

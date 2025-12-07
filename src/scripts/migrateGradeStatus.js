/**
 * Script để cập nhật status cho các kết quả học tập cũ
 * Chạy một lần để migrate dữ liệu hiện có
 */
require("dotenv").config();
const { Op } = require("sequelize");
const { SemesterResult } = require("../models");

const migrateGradeStatus = async () => {
  try {
    console.log("Bắt đầu migrate status cho semester_results...");

    // Cập nhật tất cả records chưa có status hoặc status là null thành 'APPROVED'
    const result1 = await SemesterResult.update(
      {
        status: "APPROVED",
        adminNote: null,
      },
      {
        where: {
          status: null,
        },
      }
    );
    console.log(`Đã cập nhật ${result1[0]} records có status = null thành 'APPROVED'`);

    // Cập nhật records có status rỗng
    const result2 = await SemesterResult.update(
      {
        status: "APPROVED",
        adminNote: null,
      },
      {
        where: {
          status: "",
        },
      }
    );
    console.log(`Đã cập nhật ${result2[0]} records có status = '' thành 'APPROVED'`);

    // Cập nhật status lowercase 'approved' thành 'APPROVED'
    const result3 = await SemesterResult.update(
      {
        status: "APPROVED",
      },
      {
        where: {
          status: "approved",
        },
      }
    );
    console.log(`Đã cập nhật ${result3[0]} records có status = 'approved' thành 'APPROVED'`);

    // Chuẩn hóa 'pending' -> 'PENDING' (không đổi thành APPROVED)
    const result4 = await SemesterResult.update(
      {
        status: "PENDING",
      },
      {
        where: {
          status: "pending",
        },
      }
    );
    console.log(`Đã chuẩn hóa ${result4[0]} records có status = 'pending' thành 'PENDING'`);

    // Chuẩn hóa 'rejected' -> 'REJECTED' (không đổi thành APPROVED)
    const result5 = await SemesterResult.update(
      {
        status: "REJECTED",
      },
      {
        where: {
          status: "rejected",
        },
      }
    );
    console.log(`Đã chuẩn hóa ${result5[0]} records có status = 'rejected' thành 'REJECTED'`);

    console.log("Migration hoàn tất!");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi migrate:", error);
    process.exit(1);
  }
};

// Chạy nếu được gọi trực tiếp
if (require.main === module) {
  migrateGradeStatus();
}

module.exports = migrateGradeStatus;

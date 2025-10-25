#!/usr/bin/env node

/**
 * Script thêm cột role vào bảng users
 * Chạy: npm run add-role-column
 */

require("dotenv").config();
const { PrismaClient } = require("../generated/prisma");
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();

async function addRoleColumn() {
  try {
    console.log("🚀 Bắt đầu thêm cột role vào bảng users...\n");

    // Kiểm tra xem cột role đã tồn tại chưa
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
      `;

      if (testQuery && testQuery.length > 0) {
        console.log("✅ Cột role đã tồn tại trong bảng users!");
        console.log("📝 Đang cập nhật giá trị role cho users hiện có...\n");
      }
    } catch (error) {
      console.log("📝 Cột role chưa tồn tại. Đang tạo...\n");
    }

    // Thêm cột role (nếu chưa có)
    await prisma.$executeRaw`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER'
    `;
    console.log("✅ Đã thêm cột role (nếu chưa có)");

    // Cập nhật role cho users hiện tại
    const updateAdminRole = await prisma.$executeRaw`
      UPDATE users 
      SET role = 'ADMIN' 
      WHERE "isAdmin" = true 
      AND (role IS NULL OR role = 'USER')
    `;
    console.log(
      `✅ Đã cập nhật role = 'ADMIN' cho ${updateAdminRole} admin users`
    );

    const updateUserRole = await prisma.$executeRaw`
      UPDATE users 
      SET role = 'USER' 
      WHERE "isAdmin" = false 
      AND (role IS NULL OR role = '')
    `;
    console.log(
      `✅ Đã cập nhật role = 'USER' cho ${updateUserRole} user accounts`
    );

    // Tạo index
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
      `;
      console.log("✅ Đã tạo index cho cột role");
    } catch (error) {
      console.log("⚠️  Index có thể đã tồn tại");
    }

    // Kiểm tra kết quả
    const roleStats = await prisma.$queryRaw`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY role
    `;

    console.log("\n📊 Thống kê role trong hệ thống:");
    roleStats.forEach((stat) => {
      console.log(`   ├─ ${stat.role}: ${stat.count} users`);
    });

    console.log("\n✅ Hoàn thành! Bạn có thể chạy lệnh khởi tạo super admin:");
    console.log("   npm run init-super-admin\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi thêm cột role:");
    console.error(error);
    console.log("\n💡 Gợi ý:");
    console.log("   - Kiểm tra kết nối database trong file .env");
    console.log("   - Đảm bảo DATABASE_URL đúng");
    console.log("   - Kiểm tra quyền truy cập database\n");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
addRoleColumn();

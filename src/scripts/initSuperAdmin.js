#!/usr/bin/env node

/**
 * Script khởi tạo Super Admin cho hệ thống
 * Chạy: npm run init-super-admin
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("../generated/prisma");
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();

async function initializeSuperAdmin() {
  try {
    console.log("🚀 Bắt đầu khởi tạo Super Admin...\n");

    // Kiểm tra xem đã có super admin chưa
    const existingSuperAdmin = await prisma.users.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (existingSuperAdmin) {
      console.log("❌ Super Admin đã tồn tại trong hệ thống!");
      console.log(`   Username: ${existingSuperAdmin.username}`);
      console.log(
        "\n💡 Nếu bạn muốn tạo lại, vui lòng xóa super admin hiện tại trong database.\n"
      );
      process.exit(1);
    }

    // Kiểm tra username "superadmin" đã tồn tại chưa
    const existingUser = await prisma.users.findFirst({
      where: { username: "superadmin" },
    });

    if (existingUser) {
      console.log("❌ Username 'superadmin' đã tồn tại!");
      console.log("💡 Vui lòng xóa user này trước hoặc chọn username khác.\n");
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("123456", 10);

    // Tạo Commander cho Super Admin
    const newCommander = await prisma.commanders.create({
      data: {
        id: uuidv4(),
        commanderId: "SA001",
        fullName: "Super Administrator",
        unit: "Ban Quản trị hệ thống",
        phoneNumber: "",
        email: "",
        gender: "Nam",
        avatar:
          "https://i.pinimg.com/736x/d4/a1/ff/d4a1ff9d0f243e50062e2b21f2f2496d.jpg",
      },
    });

    // Tạo Super Admin User
    const superAdmin = await prisma.users.create({
      data: {
        id: uuidv4(),
        username: "superadmin",
        password: hashedPassword,
        isAdmin: true,
        role: "SUPER_ADMIN",
        commanderId: newCommander.id,
      },
    });

    console.log("✅ Khởi tạo Super Admin thành công!\n");
    console.log("📋 Thông tin đăng nhập:");
    console.log("   ├─ Username: superadmin");
    console.log("   ├─ Password: 123456");
    console.log("   ├─ Role: SUPER_ADMIN");
    console.log("   └─ ID: " + superAdmin.id);
    console.log(
      "\n⚠️  QUAN TRỌNG: Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu!\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi khởi tạo Super Admin:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
initializeSuperAdmin();

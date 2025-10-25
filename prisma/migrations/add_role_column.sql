-- Migration: Add role column to users table
-- Date: 2025-10-25
-- Description: Thêm cột role để phân quyền chi tiết hơn (SUPER_ADMIN, ADMIN, USER)

-- Thêm cột role vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER';

-- Cập nhật role cho các user hiện tại
-- Set ADMIN cho users có isAdmin = true
UPDATE users SET role = 'ADMIN' WHERE "isAdmin" = true AND role IS NULL;

-- Set USER cho users có isAdmin = false
UPDATE users SET role = 'USER' WHERE "isAdmin" = false AND role IS NULL;

-- Bạn có thể thủ công set SUPER_ADMIN cho admin user đầu tiên
-- UPDATE users SET role = 'SUPER_ADMIN' WHERE username = 'your_super_admin_username';

-- Tạo index cho cột role để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Comment cho cột
COMMENT ON COLUMN users.role IS 'User role: SUPER_ADMIN (quản lý admin users), ADMIN (quản lý hệ thống), USER (học viên)';


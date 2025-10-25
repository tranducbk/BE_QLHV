# Hướng dẫn sử dụng hệ thống Notifications

## Tổng quan

Hệ thống notifications đã được nâng cấp với các tính năng:
- ✅ **Trạng thái đã đọc/chưa đọc** (`isRead`)
- ✅ **Phân loại thông báo** (`type`)
- ✅ **Điều hướng thông minh** (`link`)
- ✅ **Templates sẵn có** cho các tình huống thường gặp

## Các loại thông báo (Notification Types)

### 1. **new_semester** - Học kỳ mới
- **Mục đích**: Thông báo về học kỳ mới bắt đầu
- **Điều hướng**: → `/users/semester-results` (Trang nhập kết quả học tập)
- **Ví dụ**: "Học kỳ HK1 năm học 2024-2025 đã được mở. Vui lòng cập nhật kết quả học tập."

### 2. **update_info** - Cập nhật thông tin cá nhân
- **Mục đích**: Yêu cầu học viên cập nhật thông tin
- **Điều hướng**: → `/users/{userId}` (Trang thông tin cá nhân)
- **Ví dụ**: "Vui lòng kiểm tra và cập nhật thông tin cá nhân của bạn."

### 3. **tuition_fee** - Học phí
- **Mục đích**: Thông báo về học phí, nhắc nhở thanh toán
- **Điều hướng**: → `/users/tuition-fee` (Trang học phí)
- **Ví dụ**: "Học phí HK1 năm học 2024-2025 đã được cập nhật: 5,000,000 VNĐ."

### 4. **party_rating** - Đánh giá Đảng viên
- **Mục đích**: Thông báo về đánh giá Đảng viên
- **Điều hướng**: → `/users/yearly-statistics` (Trang thống kê năm)
- **Ví dụ**: "Đánh giá Đảng viên năm học 2024-2025 của bạn: Hoàn thành tốt nhiệm vụ."

### 5. **training_rating** - Xếp loại rèn luyện
- **Mục đích**: Thông báo về xếp loại rèn luyện
- **Điều hướng**: → `/users/yearly-statistics` (Trang thống kê năm)
- **Ví dụ**: "Xếp loại rèn luyện năm học 2024-2025 của bạn: Tốt."

## Cách sử dụng

### 1. Sử dụng Templates (Khuyến nghị)

```javascript
const { NOTIFICATION_TEMPLATES } = require("../helpers/notificationHelper");
const { Notification, Student } = require("../models");

// Ví dụ 1: Thông báo học kỳ mới cho TẤT CẢ học viên
const createNewSemesterNotification = async (semester, schoolYear) => {
  const students = await Student.findAll({ attributes: ["id"] });

  const notificationData = NOTIFICATION_TEMPLATES.newSemester(semester, schoolYear);

  const rows = students.map((s) => ({
    studentId: s.id,
    ...notificationData,
  }));

  await Notification.bulkCreate(rows);
};

// Ví dụ 2: Thông báo cập nhật học phí cho MỘT học viên
const notifyTuitionFeeUpdate = async (studentId, semester, schoolYear, amount) => {
  const notificationData = NOTIFICATION_TEMPLATES.tuitionFeeUpdated(
    semester,
    schoolYear,
    amount
  );

  await Notification.create({
    studentId,
    ...notificationData,
  });
};

// Ví dụ 3: Nhắc nhở học phí sắp đến hạn
const notifyTuitionFeeDue = async (studentId, semester, schoolYear, dueDate) => {
  const notificationData = NOTIFICATION_TEMPLATES.tuitionFeeDue(
    semester,
    schoolYear,
    dueDate
  );

  await Notification.create({
    studentId,
    ...notificationData,
  });
};

// Ví dụ 4: Thông báo đánh giá Đảng viên
const notifyPartyRating = async (studentId, rating, schoolYear) => {
  const notificationData = NOTIFICATION_TEMPLATES.partyRatingUpdated(
    rating,
    schoolYear
  );

  await Notification.create({
    studentId,
    ...notificationData,
  });
};

// Ví dụ 5: Thông báo xếp loại rèn luyện
const notifyTrainingRating = async (studentId, rating, schoolYear) => {
  const notificationData = NOTIFICATION_TEMPLATES.trainingRatingUpdated(
    rating,
    schoolYear
  );

  await Notification.create({
    studentId,
    ...notificationData,
  });
};
```

### 2. Tạo thông báo tùy chỉnh

```javascript
const { NOTIFICATION_TEMPLATES, NOTIFICATION_TYPES } = require("../helpers/notificationHelper");

// Thông báo tùy chỉnh với type có sẵn
const notificationData = NOTIFICATION_TEMPLATES.custom(
  "Tiêu đề thông báo",
  "Nội dung chi tiết của thông báo",
  NOTIFICATION_TYPES.UPDATE_INFO // Sẽ dùng link mặc định của type
);

await Notification.create({
  studentId: "uuid-student-id",
  ...notificationData,
});

// Thông báo tùy chỉnh với link riêng
const customNotificationData = NOTIFICATION_TEMPLATES.custom(
  "Thông báo đặc biệt",
  "Nội dung thông báo đặc biệt",
  NOTIFICATION_TYPES.NEW_SEMESTER,
  "/users/custom-page" // Link tùy chỉnh
);

await Notification.create({
  studentId: "uuid-student-id",
  ...customNotificationData,
});
```

### 3. Tạo thông báo thủ công (Không khuyến nghị)

```javascript
const { NOTIFICATION_TYPES } = require("../helpers/notificationHelper");

await Notification.create({
  studentId: "uuid-student-id",
  title: "Tiêu đề",
  content: "Nội dung",
  type: NOTIFICATION_TYPES.NEW_SEMESTER,
  link: "/users/semester-results", // Tùy chọn, nếu không có sẽ dùng mặc định
  isRead: false,
});
```

## Tích hợp vào các Controller

### Ví dụ: Tự động tạo thông báo khi cập nhật học phí

```javascript
const updateTuitionFee = async (req, res) => {
  const { studentId } = req.params;
  const { totalAmount, semester, schoolYear } = req.body;

  try {
    // Cập nhật học phí
    await TuitionFee.update(
      { totalAmount, semester, schoolYear },
      { where: { studentId } }
    );

    // Tự động tạo thông báo
    const notificationData = NOTIFICATION_TEMPLATES.tuitionFeeUpdated(
      semester,
      schoolYear,
      totalAmount.toLocaleString("vi-VN")
    );

    await Notification.create({
      studentId,
      ...notificationData,
    });

    return res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};
```

### Ví dụ: Tạo thông báo khi cập nhật xếp loại

```javascript
const updateStudentRating = async (req, res) => {
  const { yearlyResultId } = req.params;
  const { partyRating, trainingRating } = req.body;

  try {
    const yearlyResult = await YearlyResult.findByPk(yearlyResultId, {
      include: [{ model: Student }]
    });

    if (!yearlyResult) {
      return res.status(404).json({ message: "Không tìm thấy" });
    }

    // Cập nhật xếp loại
    await yearlyResult.update({ partyRating, trainingRating });

    // Tạo thông báo rèn luyện nếu có cập nhật
    if (trainingRating) {
      const notificationData = NOTIFICATION_TEMPLATES.trainingRatingUpdated(
        trainingRating,
        yearlyResult.schoolYear
      );

      await Notification.create({
        studentId: yearlyResult.studentId,
        ...notificationData,
      });
    }

    // Tạo thông báo Đảng viên nếu có cập nhật
    if (partyRating) {
      const notificationData = NOTIFICATION_TEMPLATES.partyRatingUpdated(
        partyRating,
        yearlyResult.schoolYear
      );

      await Notification.create({
        studentId: yearlyResult.studentId,
        ...notificationData,
      });
    }

    return res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};
```

## API Endpoints

### 1. Lấy danh sách thông báo
```
GET /commander/studentNotifications/:userId
```

### 2. Đánh dấu đã đọc
```
PUT /commander/notification/:userId/:notificationId
Body: { isRead: true }
```

### 3. Tạo thông báo mới
```
POST /commander/notification
Body: {
  title: "Tiêu đề",
  content: "Nội dung",
  type: "new_semester", // Tùy chọn
  link: "/users/page",  // Tùy chọn
  studentId: "uuid"     // Tùy chọn, nếu không có sẽ gửi cho tất cả
}
```

### 4. Cập nhật thông báo
```
PUT /commander/notification/:notificationId
Body: {
  title: "Tiêu đề mới",
  content: "Nội dung mới",
  type: "update_info",
  link: "/users/new-page"
}
```

### 5. Xóa thông báo
```
DELETE /commander/notification/:notificationId
```

## Lưu ý quan trọng

1. **Luôn sử dụng Templates** khi có thể để đảm bảo tính nhất quán
2. **Type và Link** sẽ tự động được map đúng nếu dùng Templates
3. **Link tùy chỉnh** sẽ override link mặc định của type
4. **Trạng thái isRead** tự động là `false` khi tạo mới
5. **Thông báo hàng loạt** sử dụng `bulkCreate` để tối ưu performance

## Testing

Để test hệ thống notifications:

1. Tạo thông báo test qua API hoặc trực tiếp trong database
2. Login vào tài khoản học viên
3. Kiểm tra icon notification có hiển thị số lượng chưa đọc
4. Click vào thông báo và kiểm tra:
   - Trạng thái đã đọc được cập nhật
   - Điều hướng đến đúng trang
   - UI thay đổi (opacity giảm cho thông báo đã đọc)

## Schema Database

```prisma
model notifications {
  id        String    @id @db.Uuid
  studentId String    @db.Uuid
  title     String    @db.VarChar(255)
  content   String?
  type      String?   @db.VarChar(255)  // new_semester, update_info, tuition_fee, party_rating, training_rating
  link      String?   @db.VarChar(255)  // URL to navigate
  isRead    Boolean?  @default(false)
  createdAt DateTime? @db.Timestamptz(6)
  updatedAt DateTime? @db.Timestamptz(6)
  students  students  @relation(fields: [studentId], references: [id], onDelete: Cascade)
}
```

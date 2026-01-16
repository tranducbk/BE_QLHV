/**
 * Helper functions for creating notifications with proper type and link
 */

const NOTIFICATION_TYPES = {
  NEW_SEMESTER: "new_semester",
  SEMESTER_RESULT: "semester_result",
  LEARNING_RESULT: "learning_result",
  UPDATE_INFO: "update_info",
  PROFILE_UPDATE: "profile_update",
  TUITION_FEE: "tuition_fee",
  TUITION_FEE_PROPOSAL: "tuition_fee_proposal", // User đề xuất học phí -> Admin nhận
  PAYMENT: "payment",
  PARTY_RATING: "party_rating",
  TRAINING_RATING: "training_rating",
  YEARLY_STATISTICS: "yearly_statistics",
  TIME_TABLE: "time_table",
  SCHEDULE: "schedule",
  CUT_RICE: "cut_rice",
  MEAL: "meal",
  COMMANDER_DUTY: "commander_duty",
  DUTY_SCHEDULE: "duty_schedule",
  ACHIEVEMENT: "achievement",
  AWARD: "award",
  REGULATION: "regulation",
  REGULATORY_REGIME: "regulatory_regime",
  NOTIFICATION: "notification",
  // Grade approval workflow
  GRADE_PROPOSAL: "grade_proposal", // User gửi đề xuất -> Admin nhận
  GRADE_APPROVED: "grade_approved", // Admin duyệt -> User nhận
  GRADE_REJECTED: "grade_rejected", // Admin từ chối -> User nhận
};

const TARGET_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
};

/**
 * Create a notification object with type and link
 * @param {string} title - Notification title
 * @param {string} content - Notification content
 * @param {string} type - Notification type from NOTIFICATION_TYPES
 * @param {string} customLink - Optional custom link (overrides default type mapping)
 * @returns {object} Notification object ready to be saved
 */
const createNotificationData = (title, content, type, customLink = null) => {
  const notification = {
    title,
    content,
    type,
    link: customLink || getDefaultLinkByType(type),
  };

  return notification;
};

/**
 * Get default link based on notification type
 * Dựa theo các route trong sidebar của user
 * @param {string} type - Notification type
 * @returns {string} Default link for the type
 */
const getDefaultLinkByType = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.NEW_SEMESTER:
    case "semester_result":
    case "learning_result":
      // Kết quả học tập
      return "/users/semester-results";
    case NOTIFICATION_TYPES.GRADE_PROPOSAL:
      // Đề xuất kết quả học tập -> Admin xem trang duyệt
      return "/admin/proposals/grade-results";
    case NOTIFICATION_TYPES.GRADE_APPROVED:
    case NOTIFICATION_TYPES.GRADE_REJECTED:
      // Kết quả duyệt -> User xem trang quản lý đề xuất
      return "/users/proposals/grade-results";
    case NOTIFICATION_TYPES.UPDATE_INFO:
    case "profile_update":
      // Thông tin cá nhân (sẽ được thêm userId ở frontend hoặc nơi gọi)
      return "/users";
    case NOTIFICATION_TYPES.TUITION_FEE:
    case "payment":
      // Học phí
      return "/users/tuition-fee";
    case NOTIFICATION_TYPES.TUITION_FEE_PROPOSAL:
      // Đề xuất học phí -> Admin xem trang quản lý học phí
      return "/admin/tuition-fees";
    case NOTIFICATION_TYPES.PARTY_RATING:
    case NOTIFICATION_TYPES.TRAINING_RATING:
    case "yearly_statistics":
      // Thống kê theo năm
      return "/users/yearly-statistics";
    case "time_table":
    case "schedule":
      // Thời khóa biểu
      return "/users/time-table";
    case "cut_rice":
    case "meal":
      // Lịch cắt cơm
      return "/users/cut-rice";
    case "commander_duty":
    case "duty_schedule":
      // Lịch trực chỉ huy
      return "/users/commander-duty-schedule";
    case "achievement":
    case "award":
      // Khen thưởng
      return "/users/achievement";
    case "regulation":
    case "regulatory_regime":
      // Chế độ quy định
      return "/users/regulatory-regime";
    case "notification":
      // Thông báo
      return "/users/notification";
    default:
      // Mặc định về trang tổng quan
      return "/users";
  }
};

/**
 * Notification templates for common scenarios
 */
const NOTIFICATION_TEMPLATES = {
  newSemester: (semester, schoolYear) =>
    createNotificationData(
      "Học kỳ mới đã bắt đầu",
      `Học kỳ ${semester} năm học ${schoolYear} đã được mở. Vui lòng cập nhật kết quả học tập của bạn.`,
      NOTIFICATION_TYPES.NEW_SEMESTER
    ),

  semesterResult: (semester, schoolYear) =>
    createNotificationData(
      "Kết quả học tập đã cập nhật",
      `Kết quả học tập ${semester} năm học ${schoolYear} của bạn đã được cập nhật. Vui lòng kiểm tra chi tiết.`,
      NOTIFICATION_TYPES.SEMESTER_RESULT
    ),

  updateInfo: () =>
    createNotificationData(
      "Cập nhật thông tin cá nhân",
      "Vui lòng kiểm tra và cập nhật thông tin cá nhân của bạn để đảm bảo tính chính xác.",
      NOTIFICATION_TYPES.UPDATE_INFO
    ),

  tuitionFeeUpdated: (semester, schoolYear, amount) =>
    createNotificationData(
      "Cập nhật học phí",
      `Học phí ${semester} năm học ${schoolYear} đã được cập nhật: ${amount} VNĐ. Vui lòng kiểm tra và thanh toán.`,
      NOTIFICATION_TYPES.TUITION_FEE
    ),

  tuitionFeeDue: (semester, schoolYear, dueDate) =>
    createNotificationData(
      "Nhắc nhở học phí",
      `Học phí ${semester} năm học ${schoolYear} sẽ đến hạn vào ${dueDate}. Vui lòng thanh toán kịp thời.`,
      NOTIFICATION_TYPES.TUITION_FEE
    ),

  partyRatingUpdated: (rating, schoolYear) =>
    createNotificationData(
      "Đánh giá Đảng viên",
      `Đánh giá Đảng viên năm học ${schoolYear} của bạn đã được cập nhật: ${rating}. Vui lòng kiểm tra chi tiết.`,
      NOTIFICATION_TYPES.PARTY_RATING
    ),

  trainingRatingUpdated: (rating, schoolYear) =>
    createNotificationData(
      "Xếp loại rèn luyện",
      `Xếp loại rèn luyện năm học ${schoolYear} của bạn đã được cập nhật: ${rating}. Vui lòng kiểm tra chi tiết.`,
      NOTIFICATION_TYPES.TRAINING_RATING
    ),

  yearlyStatistics: (schoolYear) =>
    createNotificationData(
      "Thống kê năm học",
      `Thống kê kết quả năm học ${schoolYear} của bạn đã sẵn sàng. Vui lòng kiểm tra chi tiết.`,
      NOTIFICATION_TYPES.YEARLY_STATISTICS
    ),

  timeTableUpdated: (semester, schoolYear) =>
    createNotificationData(
      "Cập nhật thời khóa biểu",
      `Thời khóa biểu ${semester} năm học ${schoolYear} đã được cập nhật. Vui lòng kiểm tra lịch học mới.`,
      NOTIFICATION_TYPES.TIME_TABLE
    ),

  cutRiceUpdated: () =>
    createNotificationData(
      "Cập nhật lịch cắt cơm",
      "Lịch cắt cơm trong tuần đã được cập nhật. Vui lòng kiểm tra chi tiết.",
      NOTIFICATION_TYPES.CUT_RICE
    ),

  commanderDutySchedule: (date) =>
    createNotificationData(
      "Lịch trực chỉ huy",
      `Bạn có lịch trực chỉ huy vào ngày ${date}. Vui lòng kiểm tra chi tiết.`,
      NOTIFICATION_TYPES.COMMANDER_DUTY
    ),

  achievementAwarded: (achievementName, year) =>
    createNotificationData(
      "Khen thưởng mới",
      `Chúc mừng! Bạn đã được thêm khen thưởng "${achievementName}" năm ${year}. Vui lòng kiểm tra chi tiết.`,
      NOTIFICATION_TYPES.ACHIEVEMENT,
      "/users/achievement"
    ),

  achievementUpdated: (achievementName, year) =>
    createNotificationData(
      "Cập nhật khen thưởng",
      `Khen thưởng "${achievementName}" năm ${year} của bạn đã được cập nhật. Vui lòng kiểm tra chi tiết.`,
      NOTIFICATION_TYPES.ACHIEVEMENT,
      "/users/achievement"
    ),

  achievementDeleted: (achievementName, year) =>
    createNotificationData(
      "Xóa khen thưởng",
      `Khen thưởng "${achievementName}" năm ${year} của bạn đã bị xóa.`,
      NOTIFICATION_TYPES.ACHIEVEMENT,
      "/users/achievement"
    ),

  regulationUpdate: () =>
    createNotificationData(
      "Cập nhật chế độ quy định",
      "Chế độ quy định đã được cập nhật. Vui lòng xem chi tiết các quy định mới.",
      NOTIFICATION_TYPES.REGULATION
    ),

  // Grade approval workflow templates
  gradeProposal: (studentName, studentId, semester, schoolYear) =>
    createNotificationData(
      "Đề xuất kết quả học tập mới",
      `Học viên ${studentName} (${studentId}) đã gửi đề xuất kết quả học tập ${semester} năm học ${schoolYear}. Vui lòng xem xét và phê duyệt.`,
      NOTIFICATION_TYPES.GRADE_PROPOSAL,
      "/admin/proposals/grade-results"
    ),

  gradeApproved: (semester, schoolYear, adminNote = null) =>
    createNotificationData(
      "Đề xuất đã được phê duyệt",
      `Kết quả học tập ${semester} năm học ${schoolYear} của bạn đã được phê duyệt.${
        adminNote ? ` Ghi chú: ${adminNote}` : ""
      }`,
      NOTIFICATION_TYPES.GRADE_APPROVED,
      "/users/proposals/grade-results"
    ),

  gradeRejected: (semester, schoolYear, adminNote) =>
    createNotificationData(
      "Đề xuất bị từ chối",
      `Kết quả học tập ${semester} năm học ${schoolYear} của bạn đã bị từ chối.\nLý do: ${adminNote}`,
      NOTIFICATION_TYPES.GRADE_REJECTED,
      "/users/proposals/grade-results"
    ),

  // Tuition fee proposal templates
  tuitionFeeProposalCreated: (studentName, studentId, semester, schoolYear, amount) =>
    createNotificationData(
      "Đề xuất học phí mới",
      `Học viên ${studentName} (${studentId}) đã thêm học phí ${semester} năm học ${schoolYear}: ${amount?.toLocaleString("vi-VN") || 0} VNĐ. Vui lòng xem xét.`,
      NOTIFICATION_TYPES.TUITION_FEE_PROPOSAL,
      "/admin/tuition-fees"
    ),

  tuitionFeeProposalUpdated: (studentName, studentId, semester, schoolYear) =>
    createNotificationData(
      "Cập nhật học phí",
      `Học viên ${studentName} (${studentId}) đã cập nhật học phí ${semester} năm học ${schoolYear}. Vui lòng xem xét.`,
      NOTIFICATION_TYPES.TUITION_FEE_PROPOSAL,
      "/admin/tuition-fees"
    ),

  custom: (title, content, type, link = null) =>
    createNotificationData(title, content, type, link),
};

module.exports = {
  NOTIFICATION_TYPES,
  TARGET_ROLES,
  createNotificationData,
  getDefaultLinkByType,
  NOTIFICATION_TEMPLATES,
};

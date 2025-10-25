/**
 * Helper functions for creating notifications with proper type and link
 */

const NOTIFICATION_TYPES = {
  NEW_SEMESTER: "new_semester",
  UPDATE_INFO: "update_info",
  TUITION_FEE: "tuition_fee",
  PARTY_RATING: "party_rating",
  TRAINING_RATING: "training_rating",
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
 * @param {string} type - Notification type
 * @returns {string} Default link for the type
 */
const getDefaultLinkByType = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.NEW_SEMESTER:
      return "/users/semester-results";
    case NOTIFICATION_TYPES.UPDATE_INFO:
      return "/users"; // Will be appended with userId in frontend
    case NOTIFICATION_TYPES.TUITION_FEE:
      return "/users/tuition-fee";
    case NOTIFICATION_TYPES.PARTY_RATING:
    case NOTIFICATION_TYPES.TRAINING_RATING:
      return "/users/yearly-statistics";
    default:
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

  custom: (title, content, type, link = null) =>
    createNotificationData(title, content, type, link),
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotificationData,
  getDefaultLinkByType,
  NOTIFICATION_TEMPLATES,
};

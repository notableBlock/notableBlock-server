const { param } = require("express-validator");

// :notificationId 파라미터 검증 — GET/DELETE 공통
const validateNotificationId = [
  param("notificationId").isMongoId().withMessage("유효하지 않은 알림 ID입니다."),
];

module.exports = { validateNotificationId };

const router = require("express").Router();
const {
  Register,
  Login,
  Logout,
  changePassword,
} = require("../controllers/authController");
const {
  getUser,
  updateCommanderDutySchedule,
  createCommanderDutySchedule,
  deleteCommanderDutySchedule,
  getCommanderDutySchedules,
  getCommanderDutySchedule,
  getCommanderDutySchedulesCurrent,
  getCommanderDutyScheduleByUserId,
} = require("../controllers/userController");
const { resetPassword, forgotPassword } = require("../services/forgotPassword");
const { verifyToken, isAdmin } = require("../middlewares/verify");

// Auth with user
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/register", Register);
router.post("/login", Login);
router.post("/logout", verifyToken, Logout);

//CRUD with commander_duty_schedule
router.get("/commanderDutySchedules", verifyToken, getCommanderDutySchedules);
router.get("/commanderDutySchedule", verifyToken, getCommanderDutySchedule);
router.get(
  "/commanderDutySchedule/:id",
  verifyToken,
  getCommanderDutyScheduleByUserId
);
router.put(
  "/commanderDutySchedule/:id",
  verifyToken,
  isAdmin,
  updateCommanderDutySchedule
);
router.post(
  "/commanderDutySchedule",
  verifyToken,
  isAdmin,
  createCommanderDutySchedule
);
router.delete(
  "/commanderDutySchedule/:id",
  verifyToken,
  isAdmin,
  deleteCommanderDutySchedule
);
router.get(
  "/commanderDutyScheduleCurrent",
  verifyToken,
  getCommanderDutySchedulesCurrent
);

// CRUD with user
router.put("/:userId", verifyToken, changePassword);
router.get("/:userId", verifyToken, getUser);

module.exports = router;

const router = require("express").Router();
const userRouter = require("./userRouter");
const studentRouter = require("./studentRouter");
const commanderRouter = require("./commanderRouter");
const universityRouter = require("./universityRouter");
const achievementRouter = require("./achievementRouter");
const timeRouter = require("./timeRouter");
const semesterRouter = require("./semesterRouter");
const gradeRouter = require("./gradeRouter");
const gradeApprovalRouter = require("./gradeApprovalRouter");

router.use("/user", userRouter);
router.use("/student", studentRouter);
router.use("/commander", commanderRouter);
router.use("/university", universityRouter);
router.use("/achievement", achievementRouter);
router.use("/time", timeRouter);
router.use("/semester", semesterRouter);
router.use("/grade", gradeRouter);
router.use("/grade-approval", gradeApprovalRouter);

module.exports = router;

const { sequelize } = require("../services/sequelize");

const University = require("./university");
const Organization = require("./organization");
const EducationLevel = require("./education_level");
const ClassModel = require("./class");
const Student = require("./student");
const User = require("./user");
const Semester = require("./semester");
const Commander = require("./commander");
const TimeTable = require("./time_table");
// Removed Violation
const SemesterResult = require("./semester_result");
const YearlyResult = require("./yearly_result");
const CutRice = require("./cut_rice");
const SubjectResult = require("./subject_result");
const TuitionFee = require("./tuition_fee");
const Achievement = require("./achievement");
const Notification = require("./notification");
const AchievementProfile = require("./achievement_profile");
const YearlyAchievement = require("./yearly_achievement");
const ScientificInitiative = require("./scientific_initiative");
const ScientificTopic = require("./scientific_topic");
const CommanderDutySchedule = require("./commander_duty_schedule");
const GradeProposal = require("./grade_proposal");
const ProposalSubjectResult = require("./proposal_subject_result");

// Associations
// University 1 - n Organization
University.hasMany(Organization, {
  foreignKey: "universityId",
  onDelete: "CASCADE",
});
Organization.belongsTo(University, { foreignKey: "universityId" });

// Organization 1 - n EducationLevel
Organization.hasMany(EducationLevel, {
  foreignKey: "organizationId",
  onDelete: "CASCADE",
});
EducationLevel.belongsTo(Organization, { foreignKey: "organizationId" });

// EducationLevel 1 - n Class
EducationLevel.hasMany(ClassModel, {
  foreignKey: "educationLevelId",
  onDelete: "CASCADE",
});
ClassModel.belongsTo(EducationLevel, { foreignKey: "educationLevelId" });

// Class 1 - n Student
ClassModel.hasMany(Student, { foreignKey: "classId", onDelete: "SET NULL" });
Student.belongsTo(ClassModel, { foreignKey: "classId" });

// Organization 1 - n Student
Organization.hasMany(Student, {
  foreignKey: "organizationId",
  onDelete: "SET NULL",
});
Student.belongsTo(Organization, { foreignKey: "organizationId" });

// University 1 - n Student
University.hasMany(Student, {
  foreignKey: "universityId",
  onDelete: "SET NULL",
});
Student.belongsTo(University, { foreignKey: "universityId" });

// EducationLevel 1 - n Student
EducationLevel.hasMany(Student, {
  foreignKey: "educationLevelId",
  onDelete: "SET NULL",
});
Student.belongsTo(EducationLevel, { foreignKey: "educationLevelId" });

// Student 1 - n TimeTable
Student.hasMany(TimeTable, { foreignKey: "studentId", onDelete: "CASCADE" });
TimeTable.belongsTo(Student, { foreignKey: "studentId" });

// Student 1 - n SemesterResult
Student.hasMany(SemesterResult, {
  foreignKey: "studentId",
  onDelete: "CASCADE",
});
SemesterResult.belongsTo(Student, { foreignKey: "studentId" });

// Student 1 - n YearlyResult
Student.hasMany(YearlyResult, { foreignKey: "studentId", onDelete: "CASCADE" });
YearlyResult.belongsTo(Student, { foreignKey: "studentId" });

// YearlyResult 1 - n SemesterResult (liên kết logic theo năm)
YearlyResult.hasMany(SemesterResult, {
  foreignKey: "yearlyResultId",
  onDelete: "SET NULL",
});
SemesterResult.belongsTo(YearlyResult, { foreignKey: "yearlyResultId" });

// Student 1 - 1 CutRice
Student.hasOne(CutRice, { foreignKey: "studentId", onDelete: "CASCADE" });
CutRice.belongsTo(Student, { foreignKey: "studentId" });

// SemesterResult 1 - n SubjectResult (tách môn học)
SemesterResult.hasMany(SubjectResult, {
  foreignKey: "semesterResultId",
  onDelete: "CASCADE",
});
SubjectResult.belongsTo(SemesterResult, { foreignKey: "semesterResultId" });

// Student 1 - n TuitionFee/Achievement/Notification
Student.hasMany(TuitionFee, { foreignKey: "studentId", onDelete: "CASCADE" });
TuitionFee.belongsTo(Student, { foreignKey: "studentId" });

Student.hasMany(Achievement, { foreignKey: "studentId", onDelete: "CASCADE" });
Achievement.belongsTo(Student, { foreignKey: "studentId" });

Student.hasMany(Notification, { foreignKey: "studentId", onDelete: "CASCADE" });
Notification.belongsTo(Student, { foreignKey: "studentId" });

// Achievements full structure
Student.hasOne(AchievementProfile, {
  foreignKey: "studentId",
  onDelete: "CASCADE",
});
AchievementProfile.belongsTo(Student, { foreignKey: "studentId" });

Student.hasMany(YearlyAchievement, {
  foreignKey: "studentId",
  onDelete: "CASCADE",
});
YearlyAchievement.belongsTo(Student, { foreignKey: "studentId" });

YearlyAchievement.hasMany(ScientificInitiative, {
  foreignKey: "yearlyAchievementId",
  onDelete: "CASCADE",
});
ScientificInitiative.belongsTo(YearlyAchievement, {
  foreignKey: "yearlyAchievementId",
});

YearlyAchievement.hasMany(ScientificTopic, {
  foreignKey: "yearlyAchievementId",
  onDelete: "CASCADE",
});
ScientificTopic.belongsTo(YearlyAchievement, {
  foreignKey: "yearlyAchievementId",
});

// User - Student/Commander (optional FKs stored in user)
// Khi xóa Student/Commander → Xóa User liên kết
Student.hasMany(User, { foreignKey: "studentId", onDelete: "CASCADE" });
User.belongsTo(Student, { foreignKey: "studentId", onDelete: "CASCADE" });

Commander.hasMany(User, { foreignKey: "commanderId", onDelete: "CASCADE" });
User.belongsTo(Commander, { foreignKey: "commanderId", onDelete: "CASCADE" });

// Student 1 - n GradeProposal
Student.hasMany(GradeProposal, {
  foreignKey: "studentId",
  onDelete: "CASCADE",
});
GradeProposal.belongsTo(Student, { foreignKey: "studentId" });

// GradeProposal 1 - n ProposalSubjectResult
GradeProposal.hasMany(ProposalSubjectResult, {
  foreignKey: "proposalId",
  onDelete: "CASCADE",
});
ProposalSubjectResult.belongsTo(GradeProposal, { foreignKey: "proposalId" });

// Commander 1 - n CommanderDutySchedule
Commander.hasMany(CommanderDutySchedule, {
  foreignKey: "commanderId",
  onDelete: "SET NULL",
});
CommanderDutySchedule.belongsTo(Commander, { foreignKey: "commanderId" });

module.exports = {
  sequelize,
  University,
  Organization,
  EducationLevel,
  ClassModel,
  Student,
  User,
  Semester,
  Commander,
  TimeTable,
  SemesterResult,
  YearlyResult,
  CutRice,
  SubjectResult,
  TuitionFee,
  Achievement,
  Notification,
  AchievementProfile,
  YearlyAchievement,
  ScientificInitiative,
  ScientificTopic,
  CommanderDutySchedule,
  GradeProposal,
  ProposalSubjectResult,
};

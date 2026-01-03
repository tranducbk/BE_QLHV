const { SemesterResult, SubjectResult, ProposalSubjectResult } = require("../models");

/**
 * Lấy kết quả học tập theo studentId, semester, schoolYear
 */
const getSemesterResult = async (studentId, semester, schoolYear) => {
  return await SemesterResult.findOne({
    where: {
      studentId,
      semester,
      schoolYear,
    },
  });
};

/**
 * Copy subjects từ proposal sang semester result
 */
const copyProposalSubjectsToResult = async (proposalId, semesterResultId) => {
  const proposalSubjects = await ProposalSubjectResult.findAll({
    where: { proposalId },
  });

  if (proposalSubjects.length > 0) {
    await SubjectResult.bulkCreate(
      proposalSubjects.map((s) => ({
        semesterResultId,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        credits: s.credits,
        letterGrade: s.letterGrade,
        gradePoint4: s.gradePoint4,
        gradePoint10: s.gradePoint10,
      }))
    );
  }

  return proposalSubjects;
};

module.exports = {
  getSemesterResult,
  copyProposalSubjectsToResult,
};


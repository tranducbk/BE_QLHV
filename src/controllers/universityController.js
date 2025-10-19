const {
  University,
  Organization,
  EducationLevel,
  ClassModel,
  Student,
} = require("../models");
const classService = require("../services/classService");

const getUniversityHierarchy = async (req, res) => {
  try {
    const { universityId } = req.params;

    const university = await University.findByPk(universityId);
    if (!university) {
      return res.status(404).json({ message: "Không tìm thấy university" });
    }

    const organizations = await Organization.findAll({
      where: { universityId },
    });

    const result = {
      university: university,
      organizations: [],
    };

    for (const organization of organizations) {
      const educationLevels = await EducationLevel.findAll({
        where: { organizationId: organization.id },
      });

      const orgWithLevels = { ...organization.toJSON(), educationLevels: [] };

      for (const level of educationLevels) {
        const classes = await ClassModel.findAll({
          where: { educationLevelId: level.id },
        });

        const levelWithClasses = { ...level.toJSON(), classes };

        orgWithLevels.educationLevels.push(levelWithClasses);
      }

      result.organizations.push(orgWithLevels);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getOrganizationsByUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;
    const organizations = await Organization.findAll({
      where: { universityId },
    });
    return res.status(200).json(organizations);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getEducationLevelsByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const educationLevels = await EducationLevel.findAll({
      where: { organizationId },
    });
    return res.status(200).json(educationLevels);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getClassesByEducationLevel = async (req, res) => {
  try {
    const { educationLevelId } = req.params;
    const classes = await ClassModel.findAll({ where: { educationLevelId } });
    return res.status(200).json(classes);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getAllUniversities = async (req, res) => {
  try {
    const universities = await University.findAll({
      where: { status: "active" },
    });
    return res.status(200).json(universities);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getUniversityById = async (req, res) => {
  try {
    const { universityId } = req.params;
    const university = await University.findByPk(universityId);
    if (!university) {
      return res.status(404).json({ message: "Không tìm thấy university" });
    }
    return res.status(200).json(university);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getOrganizationById = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Không tìm thấy organization" });
    }
    return res.status(200).json(organization);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getEducationLevelById = async (req, res) => {
  try {
    const { educationLevelId } = req.params;
    const educationLevel = await EducationLevel.findById(educationLevelId);
    if (!educationLevel) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy education level" });
    }
    return res.status(200).json(educationLevel);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getClassById = async (req, res) => {
  try {
    const { classId } = req.params;
    const classData = await ClassModel.findByPk(classId);
    if (!classData) {
      return res.status(404).json({ message: "Không tìm thấy class" });
    }
    return res.status(200).json(classData);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const createUniversity = async (req, res) => {
  try {
    const { universityCode, universityName, status } = req.body;

    // Kiểm tra university code đã tồn tại chưa
    const existingUniversityByCode = await University.findOne({
      where: { universityCode },
    });
    if (existingUniversityByCode) {
      return res.status(400).json({ message: "Mã trường đã tồn tại" });
    }

    // Kiểm tra university name đã tồn tại chưa
    const existingUniversityByName = await University.findOne({
      where: { universityName },
    });
    if (existingUniversityByName) {
      return res.status(400).json({ message: "Tên trường đã tồn tại" });
    }

    const university = await University.create({
      universityCode,
      universityName,
      status: status || "active",
    });
    return res.status(201).json(university.toJSON());
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const updateUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;
    const { universityCode, universityName, status } = req.body;

    // Kiểm tra university có tồn tại không
    const university = await University.findByPk(universityId);
    if (!university) {
      return res.status(404).json({ message: "Không tìm thấy trường đại học" });
    }

    // Kiểm tra university code mới có trùng với trường khác không
    if (universityCode !== university.universityCode) {
      const existingUniversityByCode = await University.findOne({
        where: { universityCode },
      });
      if (existingUniversityByCode) {
        return res.status(400).json({ message: "Mã trường đã tồn tại" });
      }
    }

    // Kiểm tra university name mới có trùng với trường khác không
    if (universityName !== university.universityName) {
      const existingUniversityByName = await University.findOne({
        where: { universityName },
      });
      if (existingUniversityByName) {
        return res.status(400).json({ message: "Tên trường đã tồn tại" });
      }
    }

    await university.update({
      universityCode,
      universityName,
      status: status || "active",
    });
    return res.status(200).json(university.toJSON());
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;

    // Kiểm tra university có tồn tại không
    const university = await University.findByPk(universityId);
    if (!university) {
      return res.status(404).json({ message: "Không tìm thấy trường đại học" });
    }

    // Lấy tất cả organizations thuộc về university này
    const organizations = await Organization.findAll({
      where: { universityId },
    });

    // Xóa tất cả classes trước
    for (const organization of organizations) {
      const educationLevels = await EducationLevel.findAll({
        where: { organizationId: organization.id },
      });
      for (const educationLevel of educationLevels) {
        await ClassModel.destroy({
          where: { educationLevelId: educationLevel.id },
        });
      }
    }

    // Xóa tất cả education levels
    for (const organization of organizations) {
      await EducationLevel.destroy({
        where: { organizationId: organization.id },
      });
    }

    // Xóa tất cả organizations
    await Organization.destroy({ where: { universityId } });

    // Set NULL các trường liên quan của sinh viên thay vì xóa sinh viên
    await Student.update(
      {
        universityId: null,
        organizationId: null,
        educationLevelId: null,
        classId: null,
      },
      { where: { universityId } }
    );

    // Cuối cùng xóa university
    await university.destroy();

    return res
      .status(200)
      .json({ message: "Trường đại học đã được xóa thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const createOrganization = async (req, res) => {
  try {
    const { organizationName, travelTime } = req.body;
    const { universityId } = req.params;

    const university = await University.findByPk(universityId);
    if (!university) {
      return res.status(404).json({ message: "Không tìm thấy university" });
    }

    // Kiểm tra organization name đã tồn tại trong university này chưa
    const existingOrganization = await Organization.findOne({
      where: {
        organizationName: organizationName,
        universityId: universityId,
      },
    });
    if (existingOrganization) {
      return res.status(400).json({
        message: "Tên khoa/viện đã tồn tại trong trường này",
      });
    }

    const organization = await Organization.create({
      organizationName,
      universityId,
      travelTime: travelTime || 45,
    });
    return res.status(201).json(organization.toJSON());
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const createEducationLevel = async (req, res) => {
  try {
    const { levelName } = req.body;
    const { organizationId } = req.params;

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Không tìm thấy organization" });
    }

    // Kiểm tra xem levelName đã tồn tại trong organization này chưa
    const existingEducationLevel = await EducationLevel.findOne({
      where: {
        levelName: levelName,
        organizationId: organizationId,
      },
    });

    if (existingEducationLevel) {
      return res.status(400).json({
        message: "Chương trình đào tạo đã tồn tại",
      });
    }

    const educationLevel = await EducationLevel.create({
      levelName,
      organizationId,
    });
    return res.status(201).json(educationLevel.toJSON());
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const createClass = async (req, res) => {
  try {
    const { educationLevelId } = req.params;
    const { className } = req.body;

    if (!className) {
      return res.status(400).json({ message: "Tên lớp là bắt buộc" });
    }

    // Kiểm tra className đã tồn tại trong educationLevel này chưa
    const existingClass = await ClassModel.findOne({
      where: {
        className: className,
        educationLevelId: educationLevelId,
      },
    });
    if (existingClass) {
      return res.status(400).json({
        message: "Tên lớp đã tồn tại trong chương trình đào tạo này",
      });
    }

    // Tạo lớp với studentCount = 0 ban đầu
    const newClass = await ClassModel.create({
      className,
      educationLevelId,
      studentCount: 0, // Sẽ được cập nhật tự động khi có sinh viên
    });

    return res.status(201).json(newClass);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { organizationName, travelTime } = req.body;

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Không tìm thấy organization" });
    }

    // Kiểm tra organization name mới có trùng với khoa/viện khác trong cùng university không
    if (
      organizationName &&
      organizationName !== organization.organizationName
    ) {
      const existingOrganization = await Organization.findOne({
        where: {
          organizationName: organizationName,
          universityId: organization.universityId,
        },
      });
      if (existingOrganization) {
        return res.status(400).json({
          message: "Tên khoa/viện đã tồn tại trong trường này",
        });
      }
    }

    await organization.update({
      organizationName: organizationName || organization.organizationName,
      travelTime: travelTime || organization.travelTime,
    });

    return res.status(200).json(organization);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const updateEducationLevel = async (req, res) => {
  try {
    const { educationLevelId } = req.params;
    const { levelName } = req.body;

    const educationLevel = await EducationLevel.findByPk(educationLevelId);
    if (!educationLevel) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy education level" });
    }

    // Kiểm tra levelName mới có trùng với chương trình đào tạo khác trong cùng organization không
    if (levelName && levelName !== educationLevel.levelName) {
      const existingEducationLevel = await EducationLevel.findOne({
        where: {
          levelName: levelName,
          organizationId: educationLevel.organizationId,
        },
      });
      if (existingEducationLevel) {
        return res.status(400).json({
          message: "Tên chương trình đào tạo đã tồn tại trong khoa/viện này",
        });
      }
    }

    await educationLevel.update({
      levelName: levelName || educationLevel.levelName,
    });

    return res.status(200).json(educationLevel);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { className } = req.body;

    const existingClass = await ClassModel.findByPk(classId);
    if (!existingClass) {
      return res.status(404).json({ message: "Không tìm thấy class" });
    }

    if (!className) {
      return res.status(400).json({ message: "Tên lớp là bắt buộc" });
    }

    // Kiểm tra className mới có trùng với lớp khác trong cùng educationLevel không
    if (className !== existingClass.className) {
      const existingClassByName = await ClassModel.findOne({
        where: {
          className: className,
          educationLevelId: existingClass.educationLevelId,
        },
      });
      if (existingClassByName) {
        return res.status(400).json({
          message: "Tên lớp đã tồn tại trong chương trình đào tạo này",
        });
      }
    }

    // Chỉ cho phép cập nhật className, studentCount sẽ được tính tự động
    await existingClass.update({ className });

    // Sử dụng classService để tự động cập nhật số sinh viên
    await classService.updateClassStudentCount(classId);

    const updatedClass = await ClassModel.findByPk(classId);
    return res.status(200).json(updatedClass);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const organization = await Organization.findByPk(organizationId);

    if (!organization) {
      return res.status(404).json({ message: "Không tìm thấy organization" });
    }

    // Xóa tất cả classes thuộc về organization này
    await ClassModel.destroy({ where: { organizationId } });

    // Xóa tất cả education levels thuộc về organization này
    await EducationLevel.destroy({ where: { organizationId } });

    // Set NULL các trường liên quan của sinh viên thay vì xóa sinh viên
    await Student.update(
      {
        organizationId: null,
        educationLevelId: null,
        classId: null,
      },
      { where: { organizationId } }
    );

    // Cuối cùng xóa organization chính
    await organization.destroy();

    return res
      .status(200)
      .json({ message: "Organization đã được xóa thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteEducationLevel = async (req, res) => {
  try {
    const { educationLevelId } = req.params;
    const educationLevel = await EducationLevel.findByPk(educationLevelId);

    if (!educationLevel) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy education level" });
    }

    // Xóa tất cả classes thuộc về education level này
    await ClassModel.destroy({ where: { educationLevelId } });

    // Set NULL các trường liên quan của sinh viên thay vì xóa sinh viên
    await Student.update(
      {
        educationLevelId: null,
        classId: null,
      },
      { where: { educationLevelId } }
    );

    // Cuối cùng xóa education level chính
    await educationLevel.destroy();

    return res
      .status(200)
      .json({ message: "Education level đã được xóa thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const classItem = await ClassModel.findByPk(classId);
    if (!classItem) {
      return res.status(404).json({ message: "Không tìm thấy lớp" });
    }

    // Kiểm tra xem có sinh viên trong lớp không
    if (classItem.studentCount > 0) {
      return res.status(400).json({
        message: `Không thể xóa lớp vì có ${classItem.studentCount} sinh viên đang học trong lớp này`,
      });
    }

    // Lưu thông tin trước khi xóa để cập nhật tổng số sinh viên
    const studentCount = classItem.studentCount || 0;
    const educationLevelId = classItem.educationLevelId;

    // Set NULL classId của sinh viên thay vì xóa sinh viên
    await Student.update({ classId: null }, { where: { classId } });

    // Xóa lớp
    await classItem.destroy();

    // Cập nhật tổng số sinh viên trong organization
    if (studentCount > 0) {
      const educationLevel = await EducationLevel.findByPk(educationLevelId);
      if (educationLevel) {
        const org = await Organization.findByPk(educationLevel.organizationId);
        if (org) {
          await org.update({
            totalStudents: Math.max(0, (org.totalStudents || 0) - studentCount),
          });
        }
      }
    }

    return res.status(200).json({ message: "Xóa lớp thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getOrganizationHierarchy = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Không tìm thấy organization" });
    }

    const educationLevels = await EducationLevel.findAll({
      where: { organizationId },
    });

    const result = {
      organization: organization,
      educationLevels: [],
    };

    for (const level of educationLevels) {
      const classes = await ClassModel.findAll({
        where: { educationLevelId: level.id },
      });

      const levelWithClasses = { ...level.toJSON(), classes };

      result.educationLevels.push(levelWithClasses);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getEducationLevelHierarchy = async (req, res) => {
  try {
    const { educationLevelId } = req.params;

    const educationLevel = await EducationLevel.findByPk(educationLevelId);
    if (!educationLevel) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy education level" });
    }

    const classes = await ClassModel.findAll({ where: { educationLevelId } });

    const result = {
      educationLevel: educationLevel,
      classes: classes,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const syncAllClassesStudentCount = async (req, res) => {
  try {
    const classService = require("../services/classService");
    await classService.updateAllClassesStudentCount();

    return res.status(200).json({
      message: "Đồng bộ số lượng sinh viên cho tất cả lớp thành công",
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const syncClassStudentCount = async (req, res) => {
  try {
    const { classId } = req.params;
    const classService = require("../services/classService");
    const studentCount = await classService.updateClassStudentCount(classId);

    return res.status(200).json({
      message: "Đồng bộ số lượng sinh viên thành công",
      studentCount: studentCount,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getAllUniversities,
  getUniversityHierarchy,
  getOrganizationsByUniversity,
  getEducationLevelsByOrganization,
  getClassesByEducationLevel,
  getUniversityById,
  getOrganizationById,
  getEducationLevelById,
  getClassById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  createOrganization,
  createEducationLevel,
  createClass,
  updateOrganization,
  updateEducationLevel,
  updateClass,
  deleteOrganization,
  deleteEducationLevel,
  deleteClass,
  getOrganizationHierarchy,
  getEducationLevelHierarchy,
  syncAllClassesStudentCount,
  syncClassStudentCount,
};

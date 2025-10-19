/**
 * @swagger
 * /student/{userId}:
 *   get:
 *     summary: Lấy thông tin sinh viên theo userId
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Thông tin sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{studentId}:
 *   put:
 *     summary: Cập nhật thông tin sinh viên
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/achievement:
 *   get:
 *     summary: Lấy thành tích của sinh viên
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Thành tích sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AchievementProfile'
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/time-table:
 *   get:
 *     summary: Lấy thời khóa biểu của sinh viên
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Thời khóa biểu
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/time-table:
 *   post:
 *     summary: Tạo thời khóa biểu mới
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dayOfWeek:
 *                 type: string
 *                 description: Ngày trong tuần
 *               timeSlot:
 *                 type: string
 *                 description: Khung giờ
 *               subject:
 *                 type: string
 *                 description: Môn học
 *               location:
 *                 type: string
 *                 description: Địa điểm
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/learning-information:
 *   get:
 *     summary: Lấy thông tin học tập của sinh viên
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Thông tin học tập
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/learning-information:
 *   post:
 *     summary: Thêm thông tin học tập
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               semester:
 *                 type: string
 *                 description: Học kỳ
 *               schoolYear:
 *                 type: string
 *                 description: Năm học
 *               gpa:
 *                 type: number
 *                 description: Điểm GPA
 *     responses:
 *       201:
 *         description: Thêm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /grade/{userId}:
 *   get:
 *     summary: Lấy kết quả học tập của sinh viên
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Kết quả học tập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 semesterResults:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SemesterResult'
 *                 yearlyResults:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/YearlyResult'
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /grade/{userId}/{semester}/{schoolYear}:
 *   get:
 *     summary: Lấy kết quả học tập theo học kỳ
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: semester
 *         required: true
 *         schema:
 *           type: string
 *         description: Học kỳ
 *       - in: path
 *         name: schoolYear
 *         required: true
 *         schema:
 *           type: string
 *         description: Năm học
 *     responses:
 *       200:
 *         description: Kết quả học kỳ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SemesterResult'
 *       404:
 *         description: Không tìm thấy kết quả
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /grade/{userId}:
 *   post:
 *     summary: Thêm kết quả học tập cho học kỳ
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SemesterResult'
 *     responses:
 *       201:
 *         description: Thêm thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SemesterResult'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /grade/{userId}/{semester}/{schoolYear}:
 *   put:
 *     summary: Cập nhật kết quả học tập cho học kỳ
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: semester
 *         required: true
 *         schema:
 *           type: string
 *         description: Học kỳ
 *       - in: path
 *         name: schoolYear
 *         required: true
 *         schema:
 *           type: string
 *         description: Năm học
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SemesterResult'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SemesterResult'
 *       404:
 *         description: Không tìm thấy kết quả
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /grade/{userId}/{semester}/{schoolYear}:
 *   delete:
 *     summary: Xóa kết quả học tập cho học kỳ
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: semester
 *         required: true
 *         schema:
 *           type: string
 *         description: Học kỳ
 *       - in: path
 *         name: schoolYear
 *         required: true
 *         schema:
 *           type: string
 *         description: Năm học
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy kết quả
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /achievement/{userId}:
 *   get:
 *     summary: Lấy thành tích của sinh viên
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Thành tích sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AchievementProfile'
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /achievement/{userId}:
 *   post:
 *     summary: Thêm thành tích mới
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YearlyAchievement'
 *     responses:
 *       201:
 *         description: Thêm thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YearlyAchievement'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /achievement/{userId}/{year}:
 *   put:
 *     summary: Cập nhật thành tích theo năm
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Năm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YearlyAchievement'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YearlyAchievement'
 *       404:
 *         description: Không tìm thấy thành tích
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /achievement/{userId}/{year}:
 *   delete:
 *     summary: Xóa thành tích theo năm
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Năm
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy thành tích
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /achievement/{userId}/recommendations:
 *   get:
 *     summary: Lấy đề xuất khen thưởng cho năm tiếp theo
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Đề xuất khen thưởng
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university:
 *   get:
 *     summary: Lấy danh sách tất cả trường đại học
 *     tags: [Universities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách trường đại học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/{universityId}:
 *   get:
 *     summary: Lấy thông tin trường đại học theo ID
 *     tags: [Universities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *         description: University ID
 *     responses:
 *       200:
 *         description: Thông tin trường đại học
 *       404:
 *         description: Không tìm thấy trường đại học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/{universityId}/hierarchy:
 *   get:
 *     summary: Lấy cấu trúc phân cấp của trường đại học
 *     tags: [Universities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *         description: University ID
 *     responses:
 *       200:
 *         description: Cấu trúc phân cấp
 *       404:
 *         description: Không tìm thấy trường đại học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/{universityId}/organizations:
 *   get:
 *     summary: Lấy danh sách tổ chức theo trường đại học
 *     tags: [Universities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *         description: University ID
 *     responses:
 *       200:
 *         description: Danh sách tổ chức
 *       404:
 *         description: Không tìm thấy trường đại học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/organizations/{organizationId}/education-levels:
 *   get:
 *     summary: Lấy danh sách cấp học theo tổ chức
 *     tags: [Universities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Danh sách cấp học
 *       404:
 *         description: Không tìm thấy tổ chức
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/education-levels/{educationLevelId}/classes:
 *   get:
 *     summary: Lấy danh sách lớp theo cấp học
 *     tags: [Universities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: educationLevelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Education Level ID
 *     responses:
 *       200:
 *         description: Danh sách lớp
 *       404:
 *         description: Không tìm thấy cấp học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /semester:
 *   get:
 *     summary: Lấy danh sách tất cả học kỳ
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách học kỳ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /semester/{id}:
 *   get:
 *     summary: Lấy thông tin học kỳ theo ID
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: Thông tin học kỳ
 *       404:
 *         description: Không tìm thấy học kỳ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /semester:
 *   post:
 *     summary: Tạo học kỳ mới (Admin only)
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               semesterName:
 *                 type: string
 *                 description: Tên học kỳ
 *               schoolYear:
 *                 type: string
 *                 description: Năm học
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày bắt đầu
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày kết thúc
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /semester/{id}:
 *   put:
 *     summary: Cập nhật học kỳ (Admin only)
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               semesterName:
 *                 type: string
 *                 description: Tên học kỳ
 *               schoolYear:
 *                 type: string
 *                 description: Năm học
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày bắt đầu
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày kết thúc
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy học kỳ
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /semester/{id}:
 *   delete:
 *     summary: Xóa học kỳ (Admin only)
 *     tags: [Semesters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy học kỳ
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /time/format-to-minutes:
 *   post:
 *     summary: Chuyển đổi thời gian từ HH:mm sang phút
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               time:
 *                 type: string
 *                 description: Thời gian dạng HH:mm
 *     responses:
 *       200:
 *         description: Số phút
 *       400:
 *         description: Định dạng thời gian không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /time/format-to-time:
 *   post:
 *     summary: Chuyển đổi từ phút sang HH:mm
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minutes:
 *                 type: integer
 *                 description: Số phút
 *     responses:
 *       200:
 *         description: Thời gian dạng HH:mm
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /time/current:
 *   get:
 *     summary: Lấy thời gian hiện tại
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thời gian hiện tại
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     University:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         address:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Organization:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         type:
 *           type: string
 *         universityId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     EducationLevel:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         level:
 *           type: string
 *         organizationId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Class:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         year:
 *           type: string
 *         educationLevelId:
 *           type: string
 *         studentCount:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /university:
 *   get:
 *     summary: Lấy danh sách tất cả trường đại học
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách trường đại học
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/University'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/{universityId}:
 *   get:
 *     summary: Lấy thông tin trường đại học theo ID
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *         description: University ID
 *     responses:
 *       200:
 *         description: Thông tin trường đại học
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/University'
 *       404:
 *         description: Không tìm thấy trường đại học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/create:
 *   post:
 *     summary: Tạo trường đại học mới
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Trường Đại học ABC"
 *               code:
 *                 type: string
 *                 example: "ABC"
 *               address:
 *                 type: string
 *                 example: "123 Đường ABC, Quận 1, TP.HCM"
 *     responses:
 *       201:
 *         description: Trường đại học đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/University'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/{universityId}:
 *   put:
 *     summary: Cập nhật trường đại học
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *         description: University ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Trường Đại học ABC (Updated)"
 *               code:
 *                 type: string
 *                 example: "ABC"
 *               address:
 *                 type: string
 *                 example: "456 Đường XYZ, Quận 2, TP.HCM"
 *     responses:
 *       200:
 *         description: Trường đại học đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/University'
 *       404:
 *         description: Không tìm thấy trường đại học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/{universityId}:
 *   delete:
 *     summary: Xóa trường đại học
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *         description: University ID
 *     responses:
 *       200:
 *         description: Trường đại học đã được xóa
 *       404:
 *         description: Không tìm thấy trường đại học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/{universityId}/organizations:
 *   get:
 *     summary: Lấy danh sách khoa/viện của trường đại học
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *         description: University ID
 *     responses:
 *       200:
 *         description: Danh sách khoa/viện
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Organization'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/organizations/{organizationId}:
 *   get:
 *     summary: Lấy thông tin khoa/viện theo ID
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Thông tin khoa/viện
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organization'
 *       404:
 *         description: Không tìm thấy khoa/viện
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/{universityId}/organizations:
 *   post:
 *     summary: Tạo khoa/viện mới
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *         description: University ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Khoa Công nghệ thông tin"
 *               code:
 *                 type: string
 *                 example: "CNTT"
 *               type:
 *                 type: string
 *                 example: "Khoa"
 *     responses:
 *       201:
 *         description: Khoa/viện đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organization'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/organizations/{organizationId}:
 *   put:
 *     summary: Cập nhật khoa/viện
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Khoa Công nghệ thông tin (Updated)"
 *               code:
 *                 type: string
 *                 example: "CNTT"
 *               type:
 *                 type: string
 *                 example: "Khoa"
 *     responses:
 *       200:
 *         description: Khoa/viện đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organization'
 *       404:
 *         description: Không tìm thấy khoa/viện
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/organizations/{organizationId}:
 *   delete:
 *     summary: Xóa khoa/viện
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Khoa/viện đã được xóa
 *       404:
 *         description: Không tìm thấy khoa/viện
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/organizations/{organizationId}/education-levels:
 *   get:
 *     summary: Lấy danh sách cấp học của khoa/viện
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Danh sách cấp học
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EducationLevel'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/education-levels/{educationLevelId}:
 *   get:
 *     summary: Lấy thông tin cấp học theo ID
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: educationLevelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Education Level ID
 *     responses:
 *       200:
 *         description: Thông tin cấp học
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EducationLevel'
 *       404:
 *         description: Không tìm thấy cấp học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/organizations/{organizationId}/education-levels:
 *   post:
 *     summary: Tạo cấp học mới
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - level
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Đại học"
 *               code:
 *                 type: string
 *                 example: "DH"
 *               level:
 *                 type: string
 *                 example: "Bachelor"
 *     responses:
 *       201:
 *         description: Cấp học đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EducationLevel'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/education-levels/{educationLevelId}:
 *   put:
 *     summary: Cập nhật cấp học
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: educationLevelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Education Level ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Đại học (Updated)"
 *               code:
 *                 type: string
 *                 example: "DH"
 *               level:
 *                 type: string
 *                 example: "Bachelor"
 *     responses:
 *       200:
 *         description: Cấp học đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EducationLevel'
 *       404:
 *         description: Không tìm thấy cấp học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/education-levels/{educationLevelId}:
 *   delete:
 *     summary: Xóa cấp học
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: educationLevelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Education Level ID
 *     responses:
 *       200:
 *         description: Cấp học đã được xóa
 *       404:
 *         description: Không tìm thấy cấp học
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/education-levels/{educationLevelId}/classes:
 *   get:
 *     summary: Lấy danh sách lớp của cấp học
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: educationLevelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Education Level ID
 *     responses:
 *       200:
 *         description: Danh sách lớp
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Class'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/classes/{classId}:
 *   get:
 *     summary: Lấy thông tin lớp theo ID
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Thông tin lớp
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       404:
 *         description: Không tìm thấy lớp
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/education-levels/{educationLevelId}/classes:
 *   post:
 *     summary: Tạo lớp mới
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: educationLevelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Education Level ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - year
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Lớp CNTT01"
 *               code:
 *                 type: string
 *                 example: "CNTT01"
 *               year:
 *                 type: string
 *                 example: "2024"
 *     responses:
 *       201:
 *         description: Lớp đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/classes/{classId}:
 *   put:
 *     summary: Cập nhật lớp
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Lớp CNTT01 (Updated)"
 *               code:
 *                 type: string
 *                 example: "CNTT01"
 *               year:
 *                 type: string
 *                 example: "2024"
 *     responses:
 *       200:
 *         description: Lớp đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       404:
 *         description: Không tìm thấy lớp
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /university/classes/{classId}:
 *   delete:
 *     summary: Xóa lớp
 *     tags: [University Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Lớp đã được xóa
 *       404:
 *         description: Không tìm thấy lớp
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CutRice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         studentId:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         meal:
 *           type: string
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CommanderDutySchedule:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         fullName:
 *           type: string
 *         rank:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         position:
 *           type: string
 *         workDay:
 *           type: string
 *           format: date
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Commander:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         fullName:
 *           type: string
 *         rank:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         position:
 *           type: string
 *         userId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// ===== CRUD CẮT CƠM =====

/**
 * @swagger
 * /student/{userId}/cut-rice:
 *   get:
 *     summary: Lấy lịch cắt cơm của sinh viên
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Lịch cắt cơm
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CutRice'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/cut-rice:
 *   post:
 *     summary: Tạo lịch cắt cơm mới
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - meal
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               meal:
 *                 type: string
 *                 example: "Trưa"
 *     responses:
 *       201:
 *         description: Lịch cắt cơm đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CutRice'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/cut-rice/{cutRiceId}:
 *   put:
 *     summary: Cập nhật lịch cắt cơm
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: cutRiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cut Rice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               meal:
 *                 type: string
 *                 example: "Trưa"
 *               status:
 *                 type: string
 *                 example: "Đã cắt"
 *     responses:
 *       200:
 *         description: Lịch cắt cơm đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CutRice'
 *       404:
 *         description: Không tìm thấy lịch cắt cơm
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/cut-rice/{cutRiceId}:
 *   delete:
 *     summary: Xóa lịch cắt cơm
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: cutRiceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cut Rice ID
 *     responses:
 *       200:
 *         description: Lịch cắt cơm đã được xóa
 *       404:
 *         description: Không tìm thấy lịch cắt cơm
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/auto-cut-rice:
 *   post:
 *     summary: Tạo lịch cắt cơm tự động
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *               - mealType
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-31"
 *               mealType:
 *                 type: string
 *                 example: "Trưa"
 *     responses:
 *       201:
 *         description: Lịch cắt cơm tự động đã được tạo
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/auto-cut-rice:
 *   put:
 *     summary: Cập nhật lịch cắt cơm tự động
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-31"
 *               mealType:
 *                 type: string
 *                 example: "Trưa"
 *     responses:
 *       200:
 *         description: Lịch cắt cơm tự động đã được cập nhật
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/reset-cut-rice:
 *   put:
 *     summary: Reset lịch cắt cơm tự động
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Lịch cắt cơm đã được reset
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/manual-cut-rice:
 *   put:
 *     summary: Cập nhật lịch cắt cơm thủ công
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               meal:
 *                 type: string
 *                 example: "Trưa"
 *     responses:
 *       200:
 *         description: Lịch cắt cơm thủ công đã được cập nhật
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}/debug-cut-rice:
 *   get:
 *     summary: Debug lịch cắt cơm
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Thông tin debug lịch cắt cơm
 *       500:
 *         description: Lỗi server
 */

// ===== CRUD LỊCH TRỰC BAN =====

/**
 * @swagger
 * /user/commanderDutySchedules:
 *   get:
 *     summary: Lấy danh sách lịch trực ban
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch trực ban
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommanderDutySchedule'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /user/commanderDutySchedule:
 *   get:
 *     summary: Lấy lịch trực ban hiện tại
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch trực ban hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommanderDutySchedule'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /user/commanderDutySchedule/{id}:
 *   get:
 *     summary: Lấy lịch trực ban theo ID
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Commander Duty Schedule ID
 *     responses:
 *       200:
 *         description: Lịch trực ban
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommanderDutySchedule'
 *       404:
 *         description: Không tìm thấy lịch trực ban
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /user/commanderDutySchedule/{id}:
 *   put:
 *     summary: Cập nhật lịch trực ban
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Commander Duty Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               rank:
 *                 type: string
 *                 example: "Thượng úy"
 *               phoneNumber:
 *                 type: string
 *                 example: "0123456789"
 *               position:
 *                 type: string
 *                 example: "Trưởng ban"
 *               workDay:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Lịch trực ban đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommanderDutySchedule'
 *       404:
 *         description: Không tìm thấy lịch trực ban
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /user/commanderDutySchedule:
 *   post:
 *     summary: Tạo lịch trực ban mới
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - workDay
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               rank:
 *                 type: string
 *                 example: "Thượng úy"
 *               phoneNumber:
 *                 type: string
 *                 example: "0123456789"
 *               position:
 *                 type: string
 *                 example: "Trưởng ban"
 *               workDay:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *     responses:
 *       201:
 *         description: Lịch trực ban đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommanderDutySchedule'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /user/commanderDutySchedule/{id}:
 *   delete:
 *     summary: Xóa lịch trực ban
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Commander Duty Schedule ID
 *     responses:
 *       200:
 *         description: Lịch trực ban đã được xóa
 *       404:
 *         description: Không tìm thấy lịch trực ban
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /user/commanderDutyScheduleCurrent:
 *   get:
 *     summary: Lấy lịch trực ban hiện tại
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lịch trực ban hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommanderDutySchedule'
 *       500:
 *         description: Lỗi server
 */

// ===== CRUD COMMANDER =====

/**
 * @swagger
 * /commander:
 *   get:
 *     summary: Lấy danh sách commander
 *     tags: [Commander Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách commander
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Commander'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /commander/{userId}:
 *   get:
 *     summary: Lấy thông tin commander theo userId
 *     tags: [Commander Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Thông tin commander
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Commander'
 *       404:
 *         description: Không tìm thấy commander
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /commander:
 *   post:
 *     summary: Tạo commander mới
 *     tags: [Commander Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - userId
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               rank:
 *                 type: string
 *                 example: "Thượng úy"
 *               phoneNumber:
 *                 type: string
 *                 example: "0123456789"
 *               position:
 *                 type: string
 *                 example: "Trưởng ban"
 *               userId:
 *                 type: string
 *                 example: "user-id-123"
 *     responses:
 *       201:
 *         description: Commander đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Commander'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /commander/{commanderId}:
 *   put:
 *     summary: Cập nhật commander
 *     tags: [Commander Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commanderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Commander ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Nguyễn Văn A (Updated)"
 *               rank:
 *                 type: string
 *                 example: "Thượng úy"
 *               phoneNumber:
 *                 type: string
 *                 example: "0123456789"
 *               position:
 *                 type: string
 *                 example: "Trưởng ban"
 *     responses:
 *       200:
 *         description: Commander đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Commander'
 *       404:
 *         description: Không tìm thấy commander
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /commander/{commanderId}:
 *   delete:
 *     summary: Xóa commander
 *     tags: [Commander Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commanderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Commander ID
 *     responses:
 *       200:
 *         description: Commander đã được xóa
 *       404:
 *         description: Không tìm thấy commander
 *       500:
 *         description: Lỗi server
 */

// ===== CRUD THÔNG TIN SINH VIÊN =====

/**
 * @swagger
 * /student/all:
 *   get:
 *     summary: Lấy danh sách tất cả sinh viên
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{userId}:
 *   get:
 *     summary: Lấy thông tin sinh viên theo userId
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Thông tin sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /student/{studentId}:
 *   put:
 *     summary: Cập nhật thông tin sinh viên
 *     tags: [Student Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Thông tin sinh viên đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /commander/student:
 *   post:
 *     summary: Tạo sinh viên mới (Admin only)
 *     tags: [Commander Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Sinh viên đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /commander/student/{studentId}:
 *   delete:
 *     summary: Xóa sinh viên (Admin only)
 *     tags: [Commander Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Sinh viên đã được xóa
 *       404:
 *         description: Không tìm thấy sinh viên
 *       500:
 *         description: Lỗi server
 */

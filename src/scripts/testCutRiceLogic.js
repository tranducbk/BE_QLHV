/**
 * Test script để kiểm tra logic cắt cơm với SQL
 */

const timeHelper = require("../helpers/timeHelper");
const autoCutRiceService = require("../services/autoCutRiceService");

// Test function để kiểm tra logic shouldCutMeal
const testCutMealLogic = () => {
  console.log("=== TEST CUT MEAL LOGIC ===");

  const testCases = [
    // === TEST ĐI HỌC QUA GIỜ ĂN ===
    {
      name: "Đi học qua giờ ăn sáng (5:30 -> 7:00, ăn 6:00)",
      departureTime: "5:30",
      returnTime: "7:00",
      mealTime: "06:00",
      startTime: "6:00",
      endTime: "7:00",
      expected: true,
    },
    {
      name: "Đi học qua giờ ăn trưa (10:30 -> 12:00, ăn 11:00)",
      departureTime: "10:30",
      returnTime: "12:00",
      mealTime: "11:00",
      startTime: "11:00",
      endTime: "12:00",
      expected: true,
    },
    {
      name: "Đi học qua giờ ăn chiều (16:30 -> 18:00, ăn 17:30)",
      departureTime: "16:30",
      returnTime: "18:00",
      mealTime: "17:30",
      startTime: "17:00",
      endTime: "18:00",
      expected: true,
    },

    // === TEST ĐANG HỌC ĐÚNG GIỜ ĂN ===
    {
      name: "Đang học đúng giờ ăn sáng (6:00 -> 7:00, ăn 6:00)",
      departureTime: "5:30",
      returnTime: "7:00",
      mealTime: "06:00",
      startTime: "6:00",
      endTime: "7:00",
      expected: true,
    },
    {
      name: "Đang học đúng giờ ăn trưa (11:00 -> 12:00, ăn 11:00)",
      departureTime: "10:30",
      returnTime: "12:00",
      mealTime: "11:00",
      startTime: "11:00",
      endTime: "12:00",
      expected: true,
    },

    // === TEST KHÔNG ẢNH HƯỞNG ===
    {
      name: "Không ảnh hưởng giờ ăn trưa (14:00 -> 16:00, ăn 11:00)",
      departureTime: "14:00",
      returnTime: "16:00",
      mealTime: "11:00",
      startTime: "14:00",
      endTime: "16:00",
      expected: false,
    },
    {
      name: "Không ảnh hưởng giờ ăn sáng (8:00 -> 10:00, ăn 6:00)",
      departureTime: "8:00",
      returnTime: "10:00",
      mealTime: "06:00",
      startTime: "8:00",
      endTime: "10:00",
      expected: false,
    },
    {
      name: "Không ảnh hưởng giờ ăn chiều (12:00 -> 14:00, ăn 17:30)",
      departureTime: "12:00",
      returnTime: "14:00",
      mealTime: "17:30",
      startTime: "12:00",
      endTime: "14:00",
      expected: false,
    },
  ];

  testCases.forEach((testCase, index) => {
    const result = timeHelper.shouldCutMeal(
      testCase.departureTime,
      testCase.returnTime,
      testCase.mealTime,
      testCase.startTime,
      testCase.endTime
    );
    const status = result === testCase.expected ? "✅ PASS" : "❌ FAIL";
    console.log(
      `${index + 1}. ${testCase.name}: ${status} (Expected: ${
        testCase.expected
      }, Got: ${result})`
    );

    // Debug chi tiết cho các test case fail
    if (result !== testCase.expected) {
      console.log(
        `   DEBUG: departureTime=${testCase.departureTime}, returnTime=${testCase.returnTime}, mealTime=${testCase.mealTime}`
      );
      console.log(
        `   DEBUG: startTime=${testCase.startTime}, endTime=${testCase.endTime}`
      );
    }
  });
  console.log("=== END TEST ===");
};

// Test SQL function
const testSQLFunction = async (
  studentId = "550e8400-e29b-41d4-a716-446655440000"
) => {
  console.log("=== TEST SQL FUNCTION ===");
  try {
    const cutRiceSchedule = await autoCutRiceService.generateCutRiceScheduleSQL(
      studentId
    );
    console.log(
      "SQL Function Result:",
      JSON.stringify(cutRiceSchedule, null, 2)
    );
    console.log("✅ SQL function executed successfully");
  } catch (error) {
    console.log("❌ SQL function failed:", error.message);
  }
  console.log("=== END SQL TEST ===");
};

// Chạy tất cả tests
const runAllTests = async () => {
  console.log("🚀 Starting Cut Rice Logic Tests...\n");

  // Test JavaScript logic
  testCutMealLogic();
  console.log("\n");

  // Test SQL function (cần database connection)
  await testSQLFunction();

  console.log("\n✅ All tests completed!");
};

// Export functions để có thể import từ nơi khác
module.exports = {
  testCutMealLogic,
  testSQLFunction,
  runAllTests,
};

// Chạy tests nếu file được execute trực tiếp
if (require.main === module) {
  runAllTests().catch(console.error);
}

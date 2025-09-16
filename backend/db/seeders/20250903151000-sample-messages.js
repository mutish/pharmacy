"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("Messages", [
      {
        id: "22222222-2222-2222-2222-222222222222",
        chatId: "11111111-1111-1111-1111-111111111111", 
        senderType: "user",
        content: "Hi, can I take Paracetamol and Amoxillin together?",
        sentAt: new Date(),
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        chatId: "11111111-1111-1111-1111-111111111111",
        senderType: "AI",
        content: "⚠️ Warning: Combining these can cause side effects like nausea. Please consult a pharmacist.",
        sentAt: new Date(),
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        chatId: "11111111-1111-1111-1111-111111111111",
        senderType: "pharmacist",
        content: "Yes, you can take them, but make sure to eat before taking Amoxicillin to reduce stomach upset.",
        sentAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Messages", null, {});
  },
};

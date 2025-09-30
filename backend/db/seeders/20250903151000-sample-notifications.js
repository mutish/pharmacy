"use strict";

const { message } = require("statuses");

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("Notifications", [
      {
        id: "11111111-aaaa-1111-aaaa-111111111111",
        userId: "b1f77f0e-b6d2-42db-9e42-f1a4af6e1111", // Alice
        type: "refill",
        message: "⏰ Time to reorder your blood pressure medication.",
        scheduledAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
        sentAt: null,
        status: "pending",
        read: false
      },
      {
        id: "22222222-bbbb-2222-bbbb-222222222222",
        userId: "b1f77f0e-b6d2-42db-9e42-f1a4af6e1111", // Alice
        type: "system",
        message: "✅ Your Paracetamol prescription has been processed successfully.",
        scheduledAt: null,
        sentAt: new Date(),
        status: 'sent',
        read: false
      },
      {
        id: "33333333-cccc-3333-cccc-333333333333",
        userId: "b1f77f0e-b6d2-42db-9e42-f1a4af6e1111", // Alice
        type: "promo",
        message: "🎉 Special offer: 20% off all Vitamin supplements this week!",
        scheduledAt: null,
        sentAt: new Date(),
        status: 'sent',
        read: true
      },
      {
        id: "44444444-dddd-4444-dddd-444444444444",
        userId: "c2e88e1a-c2e8-42db-9e42-f1a4af6e2222", // Bob
        type: "refill",
        message: 'Reminder: Your blood pressure medication needs renewal. Contact your doctor.',
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        sentAt: null,
        status: 'pending',
        read: false
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Notifications", null, {});
  },
};

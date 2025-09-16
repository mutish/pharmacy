"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("Chats", [
      {
        id: "11111111-1111-1111-1111-111111111111",
        userId: "b1f77f0e-b6d2-42db-9e42-f1a4af6e1111", // Alice
        pharmacistId: "c2a77e3b-a9d2-4bc9-8822-f9b64e8f2222", // Dr. Kamau
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Chats", null, {});
  },
};

"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("Orders", [
      {
        id: "d3c77f5d-a9d2-4bc9-8822-f9b64e8f5555",
        userId: "b1f77f0e-b6d2-42db-9e42-f1a4af6e1111", // Alice
        products: JSON.stringify([
          { productId: "a1f77e3b-b6d2-42db-9e42-f1a4af6e3333", qty: 2 },
        ]),
        totalAmount: 800,
        paymentMethod: "mpesa",
        paymentStatus: "paid",
        status: "delivered",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Orders", null, {});
  },
};

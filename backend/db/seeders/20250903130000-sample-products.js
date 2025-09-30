"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("Products", [
      {
        id: "a1f77e3b-b6d2-42db-9e42-f1a4af6e3333",
        name: "Paracetamol 500mg",
        description: "Pain relief and fever reducer",
        price: 50.00,
        stock: 500,
        category: "Pain Relief",
        imageUrl: "/images/paracetamol500mg.jpeg",
        prescriptionRequired: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "b2a77f4c-a9d2-4bc9-8822-f9b64e8f4444",
        name: "Augmentin 625mg",
        description: "Antibiotic for bacterial infections",
        price: 120.00,
        stock: 200,
        category: "Antibiotics",
        imageUrl: "/images/Augmentin625mg.jpeg",
        prescriptionRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Products", null, {});
  },
};

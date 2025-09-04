"use strict";
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface) {
    const hashed = await bcrypt.hash("password123", 10);
    await queryInterface.bulkInsert("Users", [
      {
        id: "b1f77f0e-b6d2-42db-9e42-f1a4af6e1111",
        name: "Alice Mwangi",
        email: "alice@tibahub.com",
        password: hashed,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "c2a77e3b-a9d2-4bc9-8822-f9b64e8f2222",
        name: "Dr. Kamau",
        email: "dr.kamau@tibahub.com",
        password: hashed,
        role: "pharmacist",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "c2e88e1a-c2e8-42db-9e42-f1a4af6e2222",
        name: "Bob Maingi",
        email: "bob@tibahub.com",
        password: hashed,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};

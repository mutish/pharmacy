"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Chats", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" }, // must match "Users"
      },
      pharmacistId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "Users", key: "id" }, // pharmacists are also Users
      },
      status: {
        type: Sequelize.ENUM("open", "closed"),
        defaultValue: "open",
      },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Chats");
  },
};

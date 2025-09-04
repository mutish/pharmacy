"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Orders", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      userId: { type: Sequelize.UUID, allowNull: false },
      products: { type: Sequelize.JSONB, allowNull: false }, 
      totalAmount: { type: Sequelize.FLOAT, allowNull: false },
      status: {
        type: Sequelize.ENUM("pending", "paid", "shipped", "delivered", "cancelled"),
        defaultValue: "pending",
      },
      paymentMethod: {
        type: Sequelize.ENUM("mpesa", "card"),
        defaultValue: "mpesa",
      },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Orders");
  },
};

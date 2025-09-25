"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Orders", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
      primaryKey: true,
    },
    userId: { type: Sequelize.UUID, allowNull: false },
    products: { type: Sequelize.JSONB, allowNull: false },
    totalAmount: { type: Sequelize.FLOAT, allowNull: false },
    paymentMethod: {
      type: Sequelize.ENUM("mpesa", "card"),
      defaultValue: "mpesa",
    },
    paymentStatus: {
      type: Sequelize.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
    },
    status: {
      type: Sequelize.ENUM("pending", "paid", "shipped", "delivered", "cancelled"),
      defaultValue: "pending",
    },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable("Orders");
}

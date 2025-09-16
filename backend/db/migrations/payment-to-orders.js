"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Orders", "paymentStatus", {
      type: Sequelize.ENUM('pending', 'paid', 'failed'),
      defaultValue: 'pending'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Orders", "paymentStatus");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Orders_paymentStatus";');
  }
};
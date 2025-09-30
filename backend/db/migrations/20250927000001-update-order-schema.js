'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to Orders table
    await queryInterface.addColumn('Orders', 'paymentId', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'shippingAddress', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    });

    await queryInterface.addColumn('Orders', 'transactionId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('Orders', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Update enum values for status and paymentStatus
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Orders_status" RENAME TO "enum_Orders_status_old";`
    );

    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_Orders_status" AS ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Orders" ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "enum_Orders_status" USING "status"::text::"enum_Orders_status";`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Orders" ALTER COLUMN "status" SET DEFAULT 'pending';`
    );

    await queryInterface.sequelize.query(
      `DROP TYPE "enum_Orders_status_old";`
    );

    // Update OrderItems table
    await queryInterface.addColumn('OrderItems', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });

    await queryInterface.addColumn('OrderItems', 'image', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('Orders', ['userId']);
    await queryInterface.addIndex('Orders', ['status']);
    await queryInterface.addIndex('Orders', ['paymentStatus']);
    await queryInterface.addIndex('OrderItems', ['orderId']);
    await queryInterface.addIndex('OrderItems', ['productId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('Orders', 'paymentId');
    await queryInterface.removeColumn('Orders', 'shippingAddress');
    await queryInterface.removeColumn('Orders', 'transactionId');
    await queryInterface.removeColumn('Orders', 'notes');
    
    // Revert enum changes
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Orders_status" RENAME TO "enum_Orders_status_new";`
    );

    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_Orders_status" AS ENUM('pending', 'shipped', 'delivered', 'cancelled');`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Orders" ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "enum_Orders_status" USING "status"::text::"enum_Orders_status";`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE "Orders" ALTER COLUMN "status" SET DEFAULT 'pending';`
    );

    await queryInterface.sequelize.query(
      `DROP TYPE "enum_Orders_status_new";`
    );

    // Remove OrderItems columns
    await queryInterface.removeColumn('OrderItems', 'name');
    await queryInterface.removeColumn('OrderItems', 'image');

    // Remove indexes
    await queryInterface.removeIndex('Orders', ['userId']);
    await queryInterface.removeIndex('Orders', ['status']);
    await queryInterface.removeIndex('Orders', ['paymentStatus']);
    await queryInterface.removeIndex('OrderItems', ['orderId']);
    await queryInterface.removeIndex('OrderItems', ['productId']);
  }
};

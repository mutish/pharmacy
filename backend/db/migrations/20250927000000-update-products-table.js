module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add new columns
      await queryInterface.addColumn(
        'Products',
        'lowStockThreshold',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 10,
        },
        { transaction }
      );
      
      await queryInterface.addColumn(
        'Products',
        'expiryDate',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );
      
      await queryInterface.addColumn(
        'Products',
        'isDeleted',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        { transaction }
      );
      
      // Rename stock to stockQuantity
      await queryInterface.renameColumn('Products', 'stock', 'stockQuantity', { transaction });
      
      // Change category to ENUM type
      await queryInterface.sequelize.query(
        'ALTER TABLE "Products" DROP CONSTRAINT IF EXISTS "Products_category_check", ' +
        'ADD CONSTRAINT "Products_category_check" CHECK ("category" IN (\'OTC\', \'Prescription\', \'Supplements\'))',
        { transaction }
      );
      
      // Drop old columns if they exist
      const tableInfo = await queryInterface.describeTable('Products');
      if (tableInfo.prescriptionRequired) {
        await queryInterface.removeColumn('Products', 'prescriptionRequired', { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Revert column renames and additions
      await queryInterface.renameColumn('Products', 'stockQuantity', 'stock', { transaction });
      
      await queryInterface.removeColumn('Products', 'lowStockThreshold', { transaction });
      await queryInterface.removeColumn('Products', 'expiryDate', { transaction });
      await queryInterface.removeColumn('Products', 'isDeleted', { transaction });
      
      // Add back prescriptionRequired column
      await queryInterface.addColumn(
        'Products',
        'prescriptionRequired',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        { transaction }
      );
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

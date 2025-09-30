"use strict";

export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable("Products", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        description: Sequelize.TEXT,
        price: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
        },
        stock: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        category: Sequelize.STRING,
        imageUrl: Sequelize.STRING,
        prescriptionRequired:{
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
        },
        updatedAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
        },
    });
}
export async function down(queryInterface) {
    await queryInterface.dropTable("Products");
}

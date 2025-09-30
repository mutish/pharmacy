"use strict";
export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable("Carts", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "Users", key: "id" },
            onDelete: "CASCADE",
        },
        productId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: "Products", key: "id" },
            onDelete: "CASCADE",
        },
        quantity: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
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
    await queryInterface.dropTable("Carts");
}

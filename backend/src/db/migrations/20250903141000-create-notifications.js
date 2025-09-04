"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Notifications", {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal("gen_random_uuid()"),
                primaryKey: true
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: "Users", key: "id" }
            },
            type: {
                type: Sequelize.ENUM('refill', 'promo', 'system'),
                defaultValue: "refill",
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false
            },

            scheduledAt: {
                type: Sequelize.DATE,
                allowNull: true, // for future reminders
            },
            sentAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },

            status: {
                type: Sequelize.ENUM("pending", "sent", "failed"),
                defaultValue: "pending",
            },
            read: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Notifications");
    }

};
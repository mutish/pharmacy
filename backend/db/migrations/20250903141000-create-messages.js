"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Messages", {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal("gen_random_uuid()"),
                primaryKey: true,
            },
            chatId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: "Chats", key: "id" },
            },
            senderType: {
                type: Sequelize.ENUM("user", "pharmacist", "AI"),
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            sentAt: { 
                type: Sequelize.DATE, 
                defaultValue: Sequelize.fn("NOW") 
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Messages");
    },

};
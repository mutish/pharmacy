import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';

const Messages = sequelize.define("Messages", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    chatId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    senderType: {
        type: DataTypes.ENUM("user", "pharmacist", "AI"),
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    sentAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },

});

Messages.associate = (models) => {
    Messages.belongsTo(models.Chats, {
      foreignKey: 'chatId',
      as: 'chat'
    });
  };

export default Messages;
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';

const Notifications = sequelize.define ("Notifications", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('refill', 'promo', 'system'),
        defaultValue: "refill",
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true, // for future reminders
    },
    sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    status: {
        type: DataTypes.ENUM("pending", "sent", "failed"),
        defaultValue: "pending",
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

Notifications.associate = (models) => {
    Notifications.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };
export default Notifications;
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';

const Notification = sequelize.define ("Notification", {
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

export default Notification;
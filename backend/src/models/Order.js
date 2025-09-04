import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';
import User from "./User.js"

const Order = sequelize.define( "Order", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.ENUM('mpesa', 'stripe', 'paypal'),
        allowNull: false
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: "pending"
    },
    status: {
        type: DataTypes.ENUM("pending","shipped","delivered","cancelled"),
        defaultValue: "pending"
    }
});

User.hasMany(Order);
Order.belongsTo(User);

export default Order;
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';
import User from "./User.js"

const Order = sequelize.define("Order", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM(
            'pending', 
            'processing', 
            'shipped', 
            'delivered', 
            'cancelled',
            'refunded'
        ),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.ENUM('card', 'mpesa'),
        allowNull: false
    },
    paymentId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    shippingAddress: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
});

Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'userId' });
    Order.hasMany(models.OrderItem, { 
        foreignKey: 'orderId',
        as: 'items',
        onDelete: 'CASCADE'
    });};

export default Order;
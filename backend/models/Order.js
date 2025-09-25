import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';
import User from "./User.js"

const Order = sequelize.define( "Order", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    products: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.ENUM('mpesa', 'stripe'),
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
Order.associate = (models) => {
    Order.belongsToMany(models.Product, {
      through: models.OrderItem,
      foreignKey: 'orderId'
    });
    Order.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'items'
    });
}

export default Order;
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';

const OrderItem = sequelize.define("OrderItem", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Orders',
            key: 'id'
        }
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Products',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    total: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.quantity * this.price;
        }
    }
}, {
    timestamps: false,
    tableName: 'OrderItems'
});

OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        onDelete: 'CASCADE'
    });
    
    OrderItem.belongsTo(models.Product, {
        foreignKey: 'productId',
        onDelete: 'RESTRICT'
    });
};

export default OrderItem;

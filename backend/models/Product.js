import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';

const Product = sequelize.define("Product", {
    id:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Product name is required"
            },
            len:{args: [2, 100], msg: "Product name must be between 2 and 100 characters"}
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        
    },
    price: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate: {
            isDecimal: { msg: 'Price must be a valid decimal number' },
            min: { args: [0], msg: 'Price cannot be negative' }
        }
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isInt: { msg: 'Stock quantity must be an integer' },
            min: { args: [0], msg: 'Stock quantity cannot be negative' }
        }
    },
    lowStockThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        validate: {
            isInt: { msg: 'Low stock threshold must be an integer' },
            min: { args: [0], msg: 'Threshold cannot be negative' }
        }
    },
    category:{
        type: DataTypes.STRING,
    },
    imageUrl:{
        type: DataTypes.STRING,
        validate: {
            isUrl: { msg: 'Invalid image URL' }
        }
    },
    // prescriptionRequired: {
    //     type: DataTypes.BOOLEAN,
    //     defaultValue: false,
    // }
    
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    paranoid: true,
    defaultScope: {
        where: { isDeleted: false }
    },
    scopes: {
        withDeleted: {
            where: {}
        }
    }
});


Product.associate = (models) => {
    Product.hasMany(models.Cart, { foreignKey: "productId" });
    Product.hasMany(models.OrderItem, { foreignKey: "productId" });
    Product.belongsToMany(models.Prescription, {
        through: 'PrescriptionItems',
        foreignKey: 'productId'
    });
};

export default Product;
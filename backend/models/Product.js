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
    },
    description: {
        type: DataTypes.TEXT,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    prescriptionRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
    
});

export default Product;
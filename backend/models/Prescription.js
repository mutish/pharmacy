import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';
import User from './User.js';

const Prescription = sequelize.define('Prescription',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ocrText: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    //Parsed medicine list (JSON)
    medicines: {
        type: DataTypes.JSONB,
        allowNull: true
    },

    //Flag: whether this was auto-extracted/ manually entered
    isManual: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    //optional pharmacist notes
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
    // status: {
    //     type: DataTypes.ENUM("pending","approved","rejected"),
    //     defaultValue: "pending"
    // },
    
});

User.hasMany(Prescription);
Prescription.belongsTo(User);

export default Prescription;
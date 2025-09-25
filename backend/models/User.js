import { DataTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user','pharmacist','admin'),
    defaultValue: 'user',
  }
});

User.associate = (models) => {
  User.hasMany(models.Notifications, {
    foreignKey: 'userId',
    as: 'notifications'
  });
};

export default User;

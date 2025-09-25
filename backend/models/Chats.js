import { DataTypes } from "sequelize";
import { sequelize } from "../db/connection.js";

const Chats = sequelize.define("Chats", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },

  pharmacistId: {
    type: DataTypes.UUID,
    allowNull: true, // null if AI bot is handling
  },

  status: {
    type: DataTypes.ENUM("open", "closed"),
    defaultValue: "open",
  },
});

Chats.associate = (models) => {
  Chats.hasMany(models.Message, {
    foreignKey: 'chatId',
    as: 'messages',
    onDelete: 'CASCADE' //Auto delete messages
  });
  Chats.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  Chats.belongsTo(models.User, {
    foreignKey: 'pharmacistId',
    as: 'pharmacist'
  });
}
export default Chats;

"use strict";
export default (sequelize, DataTypes) => {
  const Cart = sequelize.define("Cart", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  });

  Cart.associate = (models) => {
    Cart.belongsTo(models.User, { foreignKey: "userId", onDelete: "CASCADE" });
    Cart.belongsTo(models.Product, { foreignKey: "productId", onDelete: "CASCADE" });
  };

  return Cart;
};

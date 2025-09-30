import Cart from "../models/Cart.js";
import Product from "../models/Product.js";


const addToCart = async (userId, productId, quantity) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error("Product not found");

  const existing = await Cart.findOne({ where: { userId, productId } });
  if (existing) {
    existing.quantity += quantity;
    return await existing.save();
  }

  return await Cart.create({ userId, productId, quantity });
};

const getCart = async (userId) => {
  return await Cart.findAll({ where: { userId }, include: Product });
};

const removeFromCart = async (userId, productId) => {
  return await Cart.destroy({ where: { userId, productId } });
};

export default {
    addToCart,
    getCart,
    removeFromCart
};

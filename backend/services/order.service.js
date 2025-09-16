import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js"; 

const newOrder = async (userId, { paymentMethod }) => {
  const cartItems = await Cart.findAll({ where: { userId }, include: Product });
  if (!cartItems.length) throw new Error("Cart is empty");

  const total = cartItems.reduce((sum, item) => sum + item.Product.price * item.quantity, 0);

  const order = await Order.create({
    userId,
    totalAmount: total,
    paymentMethod,
    status: "pending",
  });

  // Clear cart after order
  await Cart.destroy({ where: { userId } });

  return order;
};

const fetchOrders = async (userId) => {
  return await Order.findAll({ where: { userId } });
};

const OrderById = async (userId, id) => {
  return await Order.findOne({ where: { id, userId } });
};

//cancel order
const removeOrder = async (userId, id) => {
    const order = await Order.findOne({ where: { id, userId } });
    if (!order) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Only pending orders can be cancelled");

    order.status = "cancelled";
    await order.save();
    return order;
};

export default  { newOrder, fetchOrders, OrderById, removeOrder };
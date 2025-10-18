import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

/**
 * 1. CREATE ORDER FROM CART
 */
export const createOrder = async (req, res) => {
  try {
    const { userId } = req.body;

    // 1. Get user & location
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const orderId = `OR${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2,5).toUpperCase()}`;

    // If you’re referencing the user's location directly:
    const location = user.address; // because your schema currently references user
    // (If you decide to snapshot the address instead, copy address fields here)

    // 2. Get cart items for user
    const cartItems = await Cart.find({ userId }).populate("productId");
    if (!cartItems.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 3. Calculate total and validate stock
    let totalAmount = 0;
    for (const item of cartItems) {
      const product = item.productId;

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Not enough stock for ${product.productName}`
        });
      }

      totalAmount += product.price * item.quantity;
    }

    // 4. Deduct stock
    for (const item of cartItems) {
      const product = item.productId;
      product.stock -= item.quantity;
      await product.save();
    }

    // 5. Create order
    const orderItems = cartItems.map(item => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.productId.price
    }));

    const newOrder = new Order({
      orderId,
      userId,
      location, 
      deliveryFee: 150,           // currently referencing User
      totalAmount,
      items: orderItems
    });

    await newOrder.save();

    // 6. Clear user’s cart
    await Cart.deleteMany({ userId });

    res.status(201).json({
      message: "Order created successfully",
      order: newOrder
    });

  } catch (error) {
    console.error("Error creating order:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * 2. GET ALL ORDERS FOR A USER
 */
export const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId })
      .populate("items.productId", "productName price imageUrl")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * 3. GET A SINGLE ORDER BY ID
 */
export const getSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId })
      .populate("items.productId", "productName price imageUrl")
      .populate("userId", "name email location");

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * 4. UPDATE ORDER STATUS / PAYMENT STATUS
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    res.status(200).json({ message: "Order updated", order });
  } catch (error) {
    console.error("Error updating order:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * 5. CANCEL ORDER
 */
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId }).populate("items.productId");
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({ error: "Order already cancelled" });
    }

    // restore stock
    for (const item of order.items) {
      const product = item.productId;
      product.stock += item.quantity;
      await product.save();
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.status(200).json({ message: "Order cancelled", order });
  } catch (error) {
    console.error("Error cancelling order:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("items.productId", "productName price imageUrl").sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// checkout.controller.js
import Checkout from '../models/checkout.model.js';
import Order from '../models/order.model.js';

// ✅ Create a checkout (pre-payment)
export const createCheckout = async (req, res) => {
  try {
    const { orderId, phoneNumber, deliveryAddress } = req.body;

    // 1️⃣ Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 2️⃣ Use delivery fee from order (set by admin)
    let deliveryFee = 0;
    if (deliveryAddress === "pick from pharmacy") {
      deliveryFee = 0;
    } else {
      deliveryFee = typeof order.deliveryFee === "number" ? order.deliveryFee : 0;
    } 
    const baseAmount = typeof order.totalAmount === "number" ? order.totalAmount : 0;
    const totalAmount = baseAmount + deliveryFee;

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ error: "Invalid order amount or delivery fee" });
    }

    // 3️⃣ Create checkout record
    const checkout = await Checkout.create({
      orderId,
      userId: order.userId,
      phoneNumber,
      deliveryAddress,
      amount: totalAmount,
      status: "pending"
    });

    res.status(201).json({
      message: "Checkout created successfully. Proceed to payment.",
      checkout
    });
    console.log("Checkout created successfully");
  } catch (error) {
    console.error("Error creating checkout:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Get all checkouts (admin view)
export const getAllCheckouts = async (req, res) => {
  try {
    const checkouts = await Checkout.find()
      .populate("userId", "fullname email")
      .populate("orderId", "orderId totalAmount");
    console.log("Fetched all checkouts");
    res.status(200).json(checkouts);
  } catch (error) {
    console.error("Error fetching checkouts:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Get single checkout (user or admin)
export const getCheckoutById = async (req, res) => {
  try {
    const { id } = req.params;
    const checkout = await Checkout.findById(id)
      .populate("userId", "fullname email")
      .populate("orderId", "orderId totalAmount orderStatus");

    if (!checkout) {
      return res.status(404).json({ error: "Checkout not found" });
    }

    res.status(200).json(checkout);
  } catch (error) {
    console.error("Error fetching checkout:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

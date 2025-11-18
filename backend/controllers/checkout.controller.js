// checkout.controller.js
import Checkout from '../models/checkout.model.js';
import Order from '../models/order.model.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// ✅ Create a checkout (pre-payment)

export const createCheckout = async (req, res) => {
  try {
    const { orderId, phoneNumber, deliveryAddress } = req.body;

    // 1️⃣ Validate order
    const order = await Order.findOne({ orderId }); // order creation returns orderId code
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
    // support both schemas: prefer order.total, fallback to order.totalAmount
    const baseAmount = typeof order.total === "number"
      ? order.total
      : (typeof order.totalAmount === "number" ? order.totalAmount : 0);
     const totalAmount = baseAmount + deliveryFee;

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ error: "Invalid order amount or delivery fee" });
    }

    // 3️⃣ Create checkout record
    // use the Order document's ObjectId for the checkout.orderId reference
    const checkout = await Checkout.create({
      orderId: order._id,
      userId: order.userId,
      phoneNumber,
      deliveryAddress,
      amount: totalAmount,
      status: "pending"
    });
    
    // populate the order reference so response contains order.orderId and totals
    await checkout.populate({ path: 'orderId', select: 'orderId total' });

    // 4️⃣ Initiate STK Push (simulate if no external integration)
    // If you have mpesa integration, replace the simulated block with real token + STK API call.
    let stkResult = { initiated: false };

    try {
      // Example placeholder for real MPESA call:
      // const token = await getMpesaToken(); // implement/get token
      // const stkResponse = await callMpesaStkPush({ phone: phoneNumber, amount: totalAmount, checkoutId: checkout._id });
      // ...process stkResponse...

      // For now simulate STK push initiation:
      stkResult = {
        initiated: true,
        timestamp: new Date().toISOString(),
        message: 'Simulated STK push sent'
      };

      // persist simulated mpesa metadata on checkout
      checkout.status = 'initiated';
      checkout.mpesa = { initiatedAt: stkResult.timestamp, meta: stkResult };
      await checkout.save();
    } catch (err) {
      console.error("STK initiation error:", err);
      // leave checkout pending
    }

    res.status(201).json({
      message: "Checkout created successfully. STK push initiated (if available).",
      checkout,
      stkResult
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

// New: get MPESA transactions (admin)
export const getMpesaTransactions = async (req, res) => {
  try {
    // return checkouts that have mpesaTransactionId or status indicates STK interaction
    const txs = await Checkout.find({
      $or: [
        { mpesaTransactionId: { $exists: true, $ne: null } },
        { status: { $in: ['initiated','successful'] } }
      ]
    })
      .select('checkoutId mpesaTransactionId receiptNumber amount status phoneNumber mpesa createdAt orderId userId')
      .populate('userId', 'fullname email userId')
      .populate('orderId', 'orderId total');

    res.status(200).json(txs);
  } catch (error) {
    console.error("Error fetching mpesa transactions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// checkout.model.js
import mongoose from "mongoose";

const checkoutSchema = new mongoose.Schema({
  checkoutId: {
    type: String,
    unique: true,
  },

  checkoutRequestId: {
    type: String, // from M-Pesa after STK push
  },

  // Optional MPESA fields populated on callback
  mpesaTransactionId: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  // store raw MPESA callback payload / metadata
  mpesa: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  phoneNumber: {
    type: String,
    required: true,
  },
  deliveryAddress: {
    type: String,
    required: true,
    default: "Pick from pharmacy"
  },

  amount: {
    type: Number,
    required: true,
    min: 1,
  },

  status: {
    type: String,
    enum: ["pending", "initiated", "successful", "failed"],
    default: "pending",
  },
}, { timestamps: true });

// Auto-generate checkout ID
checkoutSchema.pre("save", function (next) {
  if (this.isNew && !this.checkoutId) {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.checkoutId = `CO${timestamp}${rand}`;
  }
  next();
});

export default mongoose.model("Checkout", checkoutSchema);

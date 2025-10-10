import mongoose from "mongoose";

const checkoutSchema = new mongoose.Schema({
  checkoutId: {
    type: String,
    unique: true,
    required: true
  },

  // STK Push request ID
  checkoutRequestId: {
    type: String,
    required: true
  },

  // Final payment receipt from M-Pesa
  receiptNumber: {
    type: String,
    unique: true // ensures you don’t double-record the same payment
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  phoneNumber: {
    type: Number,
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 1
  },

  status: {
    type: String,
    enum: ["pending", "successful", "failed"],
    default: "pending"
  }

}, { timestamps: true });

checkoutSchema.pre("save", function(next) {
  if (this.isNew && !this.checkoutId) {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.random().toString(36).substring(2,5).toUpperCase();
    this.checkoutId = `CO${timestamp}${rand}`;
  }
  next();
});

export default mongoose.model("Checkout", checkoutSchema);

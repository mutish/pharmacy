import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    location:{
        type: mongoose.Schema.Types.String,
        ref: "User",
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    },
    orderStatus: {
        type: String,
        enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
        default: "placed"
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],

}, {timestamps: true});

orderSchema.pre("save", function(next) {
  if (this.isNew && !this.orderId) {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.random().toString(36).substring(2,5).toUpperCase();
    this.orderId = `OR${timestamp}${rand}`;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;


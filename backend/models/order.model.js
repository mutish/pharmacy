import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true
        // removed required: true because it's auto-generated in pre('save')
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    location:{
        type: String,
        required: true
    },
    deliveryFee: {
        type: Number,
        default: 150,
        min: 0
    },
    total: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    },
    status: {
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

// Backward compatibility virtuals (old field names)
orderSchema.virtual("totalAmount").get(function() {
  return this.total;
});
orderSchema.virtual("orderStatus").get(function() {
  return this.status;
});

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


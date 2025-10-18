import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    cartId: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    }

}, {timestamps: true});

cartSchema.pre("save", function (next) {
  if (this.isNew) {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.cartId = `CT${timestamp}${rand}`;
  }
  next();
});
const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
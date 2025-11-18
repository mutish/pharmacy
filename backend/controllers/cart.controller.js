import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

// POST /cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    let { productId, quantity = 1 } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Resolve productId: accept either Mongo _id or productId code (PR...)
    let productObjectId = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      productObjectId = productId;
    } else {
      // try find by productId field (PRxxx)
      const productRecord = await Product.findOne({ productId: productId });
      if (!productRecord) {
        return res.status(400).json({ error: "Invalid product identifier" });
      }
      productObjectId = productRecord._id;
    }

    const sanitizedQty = Math.max(1, parseInt(quantity, 10) || 1);

    let cartItem = await Cart.findOne({ userId, productId: productObjectId });

    if (cartItem) {
      cartItem.quantity += sanitizedQty;
      await cartItem.save();
    } else {
      cartItem = await Cart.create({ userId, productId: productObjectId, quantity: sanitizedQty });
    }

    // populate using the product schema fields the frontend expects
    await cartItem.populate('productId', 'productId productName price imageUrl');

    res.status(201).json(cartItem);
  } catch (err) {
    console.error("addToCart error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /cart/:userId
export const getUserCart = async (req, res) => {
  try {
    // Prefer authenticated user
    const userId = req.user?._id || req.params.userId;
    const cart = await Cart.find({ userId })
      .populate('productId', 'productId productName price imageUrl');

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// PUT /cart/:cartItemId
export const updateCartItem = async (req, res) => {
  try {
    const filter = { _id: req.params.cartItemId };
    if (req.user?._id) filter.userId = req.user._id;

    const sanitizedQty = Math.max(1, parseInt(req.body.quantity, 10) || 1);

    const updatedItem = await Cart.findOneAndUpdate(
      filter,
      { quantity: sanitizedQty },
      { new: true }
    )
    .populate('productId', 'productId productName price imageUrl');

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// DELETE /cart/:cartItemId
export const removeCartItem = async (req, res) => {
  try {
    const filter = { _id: req.params.cartItemId };
    if (req.user?._id) filter.userId = req.user._id;

    const deleted = await Cart.findOneAndDelete(filter);

    if (!deleted) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// DELETE /cart/user/:userId
export const clearCart = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'Missing user context' });
    }
    await Cart.deleteMany({ userId });
    res.status(200).json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


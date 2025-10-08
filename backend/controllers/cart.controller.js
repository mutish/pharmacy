import Cart from "../models/cart.model.js";

// POST /cart
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    // Generate cartId for new cart items
    const cartId = `CT${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // check if cart already has the product
    let cartItem = await Cart.findOne({ userId, productId });

    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      cartItem = await Cart.create({ cartId, userId, productId, quantity });
    }

    res.status(201).json(cartItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /cart/:userId
export const getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.find({ userId })
      .populate('productId', 'productId name price imageUrl');

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// PUT /cart/:cartItemId
export const updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    const updatedItem = await Cart.findByIdAndUpdate(
      cartItemId,
      { quantity },
      { new: true }
    );

    res.status(200).json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// DELETE /cart/:cartItemId
export const removeCartItem = async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.cartItemId);
    res.status(200).json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// DELETE /cart/user/:userId
export const clearCart = async (req, res) => {
  try {
    await Cart.deleteMany({ userId: req.params.userId });
    res.status(200).json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


import Cart from "../services/cart.service.js";

export const addToCart = async (req, res) => {
  try {
    const cart = await Cart.addToCart(req.user.id, req.body.productId, req.body.quantity);
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
};

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.getCart(req.user.id);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    await Cart.removeFromCart(req.user.id, req.params.productId);
    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item" });
  }
};

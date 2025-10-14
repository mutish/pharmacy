import Order from '../models/order.model.js';

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'fullname email').populate('products.product', 'productName productId');
        res.status(200).json(orders);
    } catch (error) {
        console.log("Error in getAllOrders controller", error.message);
        res.status(500).json({error:"Internal server error"});
    }
};

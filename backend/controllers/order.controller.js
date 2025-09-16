import orderService from "../services/order.service.js";

const { newOrder, fetchOrders, OrderById, removeOrder } = orderService;

export async function createOrder(req, res) {
  try {
    const order = await orderService.newOrder(req.user.id, req.body);
    res.status(201).json(order);
  } catch (err) {
    console.log("Error in createOrder controller", err.message);
    res.status(500).json({ error: "Failed to create order" });
  }
}

export async function getOrders(req, res) {
  try {
    const orders = await orderService.fetchOrders(req.user.id);
    res.json(orders);
  } catch (err) {
     console.log("Error in getOrders controller", err.message);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}

export async function getOrderById(req, res) {
  try {
    const order = await orderService.OrderById(req.user.id, req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    console.log("Error in getOrderById controller", err.message);
    res.status(500).json({ error: "Failed to fetch order" });
  }
}


//add cancel order(Delete an order)
export async function cancelOrder(req, res) {
    try {
        const order = await removeOrder(req.user.id, req.params.id);
        res.json(order);
        
    } catch (error) {
        console.log("Error in cancelOrder controller", error.message);
        res.status(500).json({ error: "Failed to cancel order" });
    }
    
}
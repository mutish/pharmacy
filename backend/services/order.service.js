import { sequelize } from '../db/connection.js';
import Cart from './cart.service.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import MpesaService from './mpesa.service.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class OrderService {
    async createOrder(userId, orderData) {
        const t = await sequelize.transaction();
        
        try {
            // 1. Get user's cart
            const cart = await Cart.getCart(userId);
            if (!cart || cart.length === 0) {
                throw new Error('Cart is empty');
            }

            // 2. Calculate total and validate stock
            let totalAmount = 0;
            const items = [];
            
            for (const item of cart) {
                const product = await Product.findByPk(item.productId, { transaction: t });
                if (!product || product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product: ${product ? product.name : 'Unknown'}`);
                }
                
                const itemTotal = product.price * item.quantity;
                totalAmount += itemTotal;
                
                items.push({
                    productId: product.id,
                    quantity: item.quantity,
                    price: product.price,
                    name: product.name,
                    image: product.images?.[0] || null
                });
                
                // Update product stock
                await Product.decrement('stock', {
                    by: item.quantity,
                    where: { id: product.id },
                    transaction: t
                });
            }

            // 3. Create order
            const order = await Order.create({
                userId,
                totalAmount,
                status: 'pending',
                paymentMethod: orderData.paymentMethod,
                paymentStatus: 'pending',
                shippingAddress: orderData.shippingAddress,
                transactionId: uuidv4()
            }, { transaction: t });

            // 4. Create order items
            const orderItems = items.map(item => ({
                ...item,
                orderId: order.id
            }));
            
            await OrderItem.bulkCreate(orderItems, { transaction: t });

            // 5. Clear cart
            await Cart.clearCart(userId, { transaction: t });

            // 6. Process payment
            const paymentResult = await this.processPayment({
                ...orderData.payment,
                amount: totalAmount,
                email: orderData.email,
                tx_ref: order.transactionId
            });

            // 7. Update order with payment details
            order.paymentId = paymentResult.id;
            order.paymentStatus = paymentResult.status;
            await order.save({ transaction: t });

            await t.commit();
            return { order, payment: paymentResult };
            
        } catch (error) {
            await t.rollback();
            console.error('Order creation failed:', error);
            throw error;
        }
    }

    async processPayment(paymentData) {
      try {
          const { amount, phone, orderId } = paymentData;
          
          const mpesaResponse =  await MpesaService.initiateSTKPush(
            phone,
            amount,
            `ORDER_${orderId}`,
            `Payment for Order #${orderId}`
          );

          return {
            success: true,
            checkoutRequestID: mpesaResponse.checkoutRequestID,
            merchantRequestID: mpesaResponse.merchantRequestID,
            message: mpesaResponse.customerMessage
          };
       
      } catch (error) {
          console.error('Payment processing failed:', error);
          throw new Error(`Payment processing failed: ${error.message}`);
      }
  }

  async verifyPayment(checkoutRequestID) {
    try {
        return await MpesaService.verifyTransaction(checkoutRequestID);
    } catch (error) {
        console.error('Payment verification failed:', error);
        throw error;
    }
}

    async updateOrderStatus(orderId, status, userId = null) {
        const order = await Order.findByPk(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Validate status transition
        const validTransitions = {
            pending: ['processing', 'cancelled'],
            processing: ['shipped', 'cancelled'],
            shipped: ['delivered'],
            delivered: ['refunded'],
            cancelled: [],
            refunded: []
        };

        if (!validTransitions[order.status]?.includes(status)) {
            throw new Error(`Invalid status transition from ${order.status} to ${status}`);
        }

        order.status = status;
        await order.save();

        // Log the status change
        console.log(`Order ${orderId} status changed to ${status}`);
        
        return order;
    }

    async getOrderById(orderId, userId) {
        return Order.findOne({
            where: { 
                id: orderId,
                ...(userId && { userId }) // Only filter by userId if provided (for admin access)
            },
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    attributes: ['id', 'productId', 'quantity', 'price', 'name', 'image']
                }
            ]
        });
    }

    async getUserOrders(userId, { status, startDate, endDate, page = 1, limit = 10 }) {
        const where = { userId };
        
        if (status) where.status = status;
        if (startDate && endDate) {
            where.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        return Order.findAndCountAll({
            where,
            include: [
                {
                    model: OrderItem,
                    as: 'items',
                    attributes: ['id', 'productId', 'quantity', 'price', 'name']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });
    }
}

export default new OrderService();
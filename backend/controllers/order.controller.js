import orderService from '../services/order.service.js';
import callback from '../services/mpesa.service.js';
import { validationResult } from 'express-validator';

export const createOrder = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { paymentMethod, shippingAddress, payment } = req.body;
        const userId = req.user.id;

        const result = await orderService.createOrder(userId, {
            paymentMethod,
            shippingAddress,
            payment,
            email: req.user.email
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: result.order,
                payment: {
                    authorization_url: result.payment?.link,
                    ...result.payment
                }
            }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await orderService.getOrderById(id, req.user.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
        
        const result = await orderService.getUserOrders(req.user.id, {
            status,
            startDate,
            endDate,
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 50) // Max 50 items per page
        });

        res.json({
            success: true,
            data: {
                orders: result.rows,
                pagination: {
                    total: result.count,
                    page: parseInt(page),
                    pages: Math.ceil(result.count / limit),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const order = await orderService.updateOrderStatus(id, status, req.user.id);
        
        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating order status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const mpesaCallback = async (req, res) => {
    const {Body: { stkCallback: callback }} = req.body;

    try {
        if (callback.ResultCode === 0){
            //Successful payment
            const metadata = callback.CallbackMetadata?.Item || [];
            const amount = metadata.find(item => item.Name === 'Amount')?.Value;
            const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
            const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

            //update order status
            await orderService.updateOrderStatus(
                callback.CheckoutRequestID,
                'processing',
                null,
                {
                    mpesaReceiptNumber,
                    phoneNumber,
                    amount
                }
            );
        }else {
            //payment failed
            await orderService.updateOrderStatus(
                callback.CheckoutRequestID,
                'failed',
                null,
                {failureReason: callback.ResultDesc}
            );
        }
        res.status(200).json({ResultCode: 0, ResultDesc: 'Success'});
    } catch (error) {
        console.error('Mpesa Callback error:', error);
        res.status(500).json({ResultCode: 1, ResultDesc: 'Failed'});
    }

};
export const processWebhook = async (req, res) => {
    try {
        const signature = req.headers['verif-hash'];
        const payload = req.body;

        // Verify webhook signature
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
        if (signature !== secretHash) {
            return res.status(401).json({ status: 'unauthorized' });
        }

        const { event, data } = payload;

        switch (event) {
            case 'charge.completed':
                // Update order status based on payment status
                if (data.status === 'successful') {
                    await orderService.updateOrderStatus(
                        data.tx_ref, // This should be your order transaction ID
                        'processing'
                    );
                } else {
                    await orderService.updateOrderStatus(
                        data.tx_ref,
                        'failed'
                    );
                }
                break;
            
            case 'refund.completed':
                await orderService.updateOrderStatus(
                    data.tx_ref,
                    'refunded'
                );
                break;
        }

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
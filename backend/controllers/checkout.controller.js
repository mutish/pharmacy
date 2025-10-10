import Order from '../models/order.model.js';
import Checkout from '../models/checkout.model.js';
import Product from '../models/product.model.js';
import getMpesaToken from '../utils/mpesaToken.js';
import axios from 'axios';
import nodemailer from 'nodemailer';

// Initiate M-Pesa STK Push and save checkout record
export const initiateMpesaPayment = async (req, res) => {
    try {
        const { orderId, phoneNumber } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });

        const deliveryFee = 150;
        const amount = order.totalAmount + deliveryFee;

        const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        const password = Buffer.from(
            process.env.MPESA_PAYBILL + process.env.MPESA_PASSKEY + timestamp
        ).toString('base64');

        const token = await getMpesaToken();

        const payload = {
            BusinessShortCode: process.env.MPESA_PAYBILL,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: process.env.MPESA_PAYBILL,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: order.orderId,
            TransactionDesc: 'Order Payment'
        };

        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            payload,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        // Log full response for debugging
        console.log("Mpesa STK Push response:", response.data);

        const checkoutId = `CO${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2,5).toUpperCase()}`;
        const { CheckoutRequestID } = response.data;
        await Checkout.create({
            checkoutId,
            checkoutRequestId: CheckoutRequestID,
            orderId: order._id,
            userId: order.userId,
            phoneNumber,
            amount,
            status: 'pending'
        });

        res.status(200).json({
            message: "STK Push sent, check your phone",
            checkoutRequestId: CheckoutRequestID
        });

    } catch (error) {
        // Log full error response for debugging
        if (error.response) {
            console.log("Payment error response:", error.response.data);
        } else {
            console.log("Payment error: ", error.message);
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// M-Pesa Callback: update checkout, order, send e-receipt
export const mpesaCallback = async (req, res) => {
    try {
        const { Body } = req.body;
        const stk = Body.stkCallback;

        // Find checkout record by checkoutRequestId
        const checkout = await Checkout.findOne({ checkoutRequestId: stk.CheckoutRequestID });
        if (!checkout) {
            console.log('Checkout record not found for callback');
            return res.status(404).json({ error: 'Checkout record not found' });
        }

        if (stk.ResultCode !== 0) {
            checkout.status = 'failed';
            await checkout.save();
            console.log('Payment failed or cancelled');
            return res.status(200).json({ message: 'Payment failed' });
        }

        const metadata = stk.CallbackMetadata.Item.reduce((acc, item) => {
            acc[item.Name] = item.Value;
            return acc;
        }, {});

        // Update checkout record with receipt number and status
        checkout.receiptNumber = metadata.MpesaReceiptNumber;
        checkout.amount = metadata.Amount;
        checkout.status = 'successful';
        await checkout.save();

        // Update order
        const order = await Order.findById(checkout.orderId);
        if (order) {
            order.paymentStatus = 'completed';
            order.orderStatus = 'processing';
            await order.save();

            // Reduce stock for all ordered items
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: -item.quantity }
                });
            }

            // Send e-receipt to user
            const userEmail = order.userEmail || 'customer@example.com'; // Replace with actual user email if available
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.MAIL_USER,
                to: userEmail,
                subject: 'Order Receipt',
                text: `Payment successful. Transaction ID: ${metadata.MpesaReceiptNumber}, Amount: ${metadata.Amount}`
            });

            console.log('Payment successful, stock updated, receipt sent');
        }

        res.status(200).json({ message: 'Payment processed successfully' });

    } catch (error) {
        console.error('Callback error:', error.message);
        res.status(500).json({ error: 'Callback processing failed' });
    }
};

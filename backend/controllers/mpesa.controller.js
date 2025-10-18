// mpesa.controller.js
import axios from "axios";
import dotenv from "dotenv";
import Checkout from "../models/checkout.model.js";
import Order from "../models/order.model.js";
import  getMpesaToken  from "../utils/mpesaToken.js";

dotenv.config();



export const stkPush = async (req, res) => {
  try {
    const { phoneNumber, amount, checkoutId } = req.body;

    if (!phoneNumber || !amount || !checkoutId) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Find checkout
    const checkout = await Checkout.findById(checkoutId).populate("orderId");
    if (!checkout) return res.status(404).json({ error: "Checkout not found." });

    const token = await getMpesaToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
    ).toString("base64");

    const url =
      process.env.MPESA_ENV === "sandbox"
        ? "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        : "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: checkout.checkoutId,
      TransactionDesc: "Order Payment",
    };

    const { data } = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Save checkoutRequestId
    checkout.checkoutRequestId = data.CheckoutRequestID;
    await checkout.save();

    res.status(200).json({
      message: "STK push initiated successfully. Enter PIN on phone.",
      data,
    });
  } catch (error) {
    console.error("STK Push Error:", error.message);
    res.status(500).json({ error: "Failed to initiate payment." });
  }
};


export const mpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    const resultCode = callbackData.Body?.stkCallback?.ResultCode;
    const checkoutRequestID = callbackData.Body?.stkCallback?.CheckoutRequestID;

    const checkout = await Checkout.findOne({ checkoutRequestId: checkoutRequestID }).populate("orderId");

    if (!checkout) {
      console.log("No checkout found for:", checkoutRequestID);
      return res.status(404).json({ error: "Checkout not found." });
    }

    if (resultCode === 0) {
      const metadata = callbackData.Body.stkCallback.CallbackMetadata.Item;
      const receipt = metadata.find((item) => item.Name === "MpesaReceiptNumber")?.Value;

      checkout.status = "successful";
      checkout.receiptNumber = receipt;
      await checkout.save();

      // Update order status
      checkout.orderId.orderStatus = "paid";
      await checkout.orderId.save();

      console.log("✅ Payment successful for:", receipt);
    } else {
      checkout.status = "failed";
      await checkout.save();
      console.log("❌ Payment failed for:", checkoutRequestID);
    }

    res.status(200).json({ message: "Callback processed successfully" });
  } catch (error) {
    console.error("Callback Error:", error.message);
    res.status(500).json({ error: "Error handling callback" });
  }
};

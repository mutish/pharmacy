import axios from "axios";
import dotenv from "dotenv";
import Checkout from "../models/checkout.model.js";
import Order from "../models/order.model.js";
import  getMpesaToken  from "../utils/mpesaToken.js";
import mongoose from "mongoose"; // add safe ObjectId checks

dotenv.config();

// Helper: normalize Kenyan MSISDN to 2547XXXXXXXX
const normalizeMsisdn = (raw) => {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("+254")) return digits.slice(1);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits; // let API validate as last resort
};

// Helper: STK AccountReference must be <= 12 alphanumeric chars
const sanitizeAccountRef = (val) => {
  const safe = String(val || "").replace(/[^a-zA-Z0-9]/g, "");
  return safe.slice(-12) || "ORDERPAY";
};

const buildAxiosErrorDetails = (error) => {
  if (error.response) {
    return {
      type: "response",
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    };
  }
  if (error.request) {
    return {
      type: "request",
      code: error.code,
      url: error.config?.url,
      method: error.config?.method,
      timeout: error.config?.timeout,
    };
  }
  return { type: "generic", message: error.message };
};

export const stkPush = async (req, res) => {
  try {
    const { phoneNumber, checkoutId } = req.body;

    if (!phoneNumber || !checkoutId) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Validate critical envs early
    const requiredEnvs = ["MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_CALLBACK_URL"];
    const missing = requiredEnvs.filter((k) => !process.env[k]);
    if (missing.length) {
      return res.status(500).json({ error: `Missing env vars: ${missing.join(", ")}` });
    }

    // Find checkout by custom checkoutId (CO...) or Mongo _id (only if valid)
    const orQuery = [{ checkoutId }];
    if (mongoose.Types.ObjectId.isValid(checkoutId)) {
      orQuery.push({ _id: checkoutId });
    }
    const checkout = await Checkout.findOne({ $or: orQuery }).populate("orderId");
    if (!checkout) return res.status(404).json({ error: "Checkout not found." });

    // Use amount from checkout (created from order + delivery)
    const amount = Number(checkout.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount for this checkout." });
    }

    const token = await getMpesaToken();
    if (!token) {
      return res.status(500).json({ error: "Failed to obtain M-Pesa access token." });
    }

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    const password = Buffer.from(
      process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
    ).toString("base64");

    const url =
      process.env.MPESA_ENV === "sandbox"
        ? "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        : "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const msisdn = normalizeMsisdn(phoneNumber);
    const rawRef = checkout.orderId?.orderId || checkout.checkoutId || String(checkout._id);
    const accountRef = sanitizeAccountRef(rawRef);

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: msisdn,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: msisdn,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: accountRef,
      TransactionDesc: "OrderPay",
    };

    console.debug("STK payload summary:", {
      msisdn,
      amount: Math.round(amount),
      shortCode: process.env.MPESA_SHORTCODE,
      accountRef,
      env: process.env.MPESA_ENV,
    });

    const { data } = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });

    // Save STK request metadata
    checkout.checkoutRequestId = data.CheckoutRequestID;
    checkout.merchantRequestId = data.MerchantRequestID;
    await checkout.save();

    res.status(200).json({
      message: "STK push initiated successfully. Enter PIN on phone.",
      data,
    });
  } catch (error) {
    const details = buildAxiosErrorDetails(error);
    console.error("STK Push Error:", details, error.stack);
    res.status(500).json({ error: "Failed to initiate payment.", details });
  }
};

export const mpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    const resultCode = Number(callbackData.Body?.stkCallback?.ResultCode);
    const checkoutRequestID = callbackData.Body?.stkCallback?.CheckoutRequestID;

    const checkout = await Checkout.findOne({ checkoutRequestId: checkoutRequestID }).populate("orderId");

    if (!checkout) {
      console.log("No checkout found for:", checkoutRequestID);
      return res.status(404).json({ error: "Checkout not found." });
    }

    if (resultCode === 0) {
      const metadata = callbackData.Body.stkCallback.CallbackMetadata.Item || [];
      const receipt = metadata.find((item) => item.Name === "MpesaReceiptNumber")?.Value;
      const paidAmount = metadata.find((item) => item.Name === "Amount")?.Value;

      checkout.status = "successful";
      checkout.receiptNumber = receipt;
      if (paidAmount) checkout.paidAmount = paidAmount;
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

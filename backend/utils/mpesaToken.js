import axios from 'axios';
import https from "https";

const httpsAgent = new https.Agent({ keepAlive: true, timeout: 15000 });

const getMpesaToken = async () => {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    if (!consumerKey || !consumerSecret) {
      throw new Error("Missing MPESA consumer credentials");
    }

    const baseUrl =
      process.env.MPESA_ENV === "development"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";
    const url = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

    const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const { data } = await axios.get(url, {
      headers: { Authorization: `Basic ${authHeader}` },
      httpsAgent,
      timeout: 15000,
    });

    return data.access_token;
  } catch (error) {
    console.error("Mpesa token fetch failed:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    });
    throw new Error("Unable to fetch M-Pesa token");
  }
};

export default getMpesaToken;
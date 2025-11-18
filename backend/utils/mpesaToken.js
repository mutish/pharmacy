import axios from 'axios';
import https from "https";

const httpsAgent = new https.Agent({ keepAlive: true, timeout: 30000 });

/**
 * Fetch M-Pesa OAuth token with retries and exponential backoff.
 * Throws on permanent failure.
 */
const getMpesaToken = async ({ retries = 3, backoffMs = 1000 } = {}) => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing MPESA consumer credentials");
  }

  const baseUrl =
    process.env.MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
  const url = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
  const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const { data } = await axios.get(url, {
        headers: { Authorization: `Basic ${authHeader}` },
        httpsAgent,
        timeout: 30000,
      });
      if (data && data.access_token) return data.access_token;
      throw new Error("No access_token in response");
    } catch (error) {
      attempt++;
      const isLast = attempt > retries;
      console.error(`Mpesa token fetch attempt ${attempt} failed:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code,
      });
      if (isLast) {
        throw new Error("Unable to fetch M-Pesa token");
      }
      // exponential backoff
      await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error("Unable to fetch M-Pesa token");
};

export default getMpesaToken;
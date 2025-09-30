import dotenv from 'dotenv';
import Mpesa from 'mpesa-node';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Debug log environment variables
console.log('Environment Variables:', {
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY ? '***' : 'MISSING',
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET ? '***' : 'MISSING',
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE || 'MISSING',
  NODE_ENV: process.env.NODE_ENV || 'development'
});

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  shortCode: process.env.MPESA_SHORTCODE,
  initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD,
  securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
  certPath: null
});

class MpesaService {
  async initiateSTKPush(phone, amount, accountReference, description) {
    try {
      const response = await mpesa.mpesa.lipaNaMpesaOnline({
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.CALLBACK_URL,
        AccountReference: accountReference,
        passKey: process.env.MPESA_PASSKEY,
        TransactionType: 'CustomerPayBillOnline',
        TransactionDesc: description || process.env.MPESA_TRANSACTION_DESC
      });

      return {
        success: true,
        checkoutRequestID: response.CheckoutRequestID,
        merchantRequestID: response.MerchantRequestID,
        responseCode: response.ResponseCode,
        responseDescription: response.ResponseDescription,
        customerMessage: response.CustomerMessage
      };
    } catch (error) {
      console.error('M-Pesa STK Push Error:', error);
      throw new Error(error.message || 'Failed to initiate M-Pesa payment');
    }
  }

  async verifyTransaction(checkoutRequestID) {
    try {
      const response = await mpesa.mpesa.lipaNaMpesaQuery({
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: Buffer.from(
          `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${new Date()
            .toISOString()
            .replace(/[^0-9]/g, '')
            .slice(0, 14)}`
        ).toString('base64'),
        CheckoutRequestID: checkoutRequestID
      });

      return {
        success: response.ResultCode === '0',
        resultCode: response.ResultCode,
        resultDesc: response.ResultDesc,
        transactionID: response.TransactionID,
        amount: response.Amount,
        mpesaReceiptNumber: response.MpesaReceiptNumber,
        transactionDate: response.TransactionDate,
        phoneNumber: response.PhoneNumber
      };
    } catch (error) {
      console.error('M-Pesa Transaction Verification Error:', error);
      throw new Error('Failed to verify M-Pesa transaction');
    }
  }
}

export default new MpesaService();
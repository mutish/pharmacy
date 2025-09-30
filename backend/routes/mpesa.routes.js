import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const router = express.Router();

// Add JSON body parser middleware specifically for this router
router.use(express.json());

// Middleware to log requests
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});


// M-Pesa access token
async function getAccessToken() {
    console.log('Generating access token...');
    try {
        // Verify environment variables
        if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
            throw new Error('Missing required environment variables: MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET');
        }
        
        const auth = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString('base64');

        console.log('Auth:', auth ? '***' : 'MISSING');
        console.log('Consumer Key:', process.env.MPESA_CONSUMER_KEY ? '***' : 'MISSING');
        console.log('Consumer Secret:', process.env.MPESA_CONSUMER_SECRET ? '***' : 'MISSING');

        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            { 
                headers: { 
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json'
                } ,
                timeout: 10000,
            }
        );
        if(!response.data.access_token){
            throw new Error('NO access token in response: '+ JSON.stringify(response.data));
        }

        console.log('Access token generated successfully');
        return response.data.access_token;
    } catch (error) {
        console.error('Error generating access token:', {
            message: error.message,
            code: error.code,
            response: error.response? {
                status: error.response.status,
                statusText: error.response.statusText,
                headers: error.response.headers,
                data: error.response.data
            }: 'No response',
            stack: error.stack
        });
        throw new Error('Failed to generate access token:'+ error.message);
    }
}

// STK Push endpoint
router.post('/stkpush', express.json(), async (req, res) => {
    console.log('STK Push request received:', {
        body: req.body,
        headers: req.headers
    });

    try {
        if (!req.body || typeof req.body !== 'object') {
            console.error('Invalid request body:', req.body);
            return res.status(400).json({ 
                error: 'Invalid request body',
                received: req.body
            });
        }
        const { phone, amount } = req.body;
        
        // Validate input
        if (!phone || !amount) {
            console.error('Validation failed:', { phone, amount });
            return res.status(400).json({ 
                error: 'Phone and amount are required',
                received: { phone, amount }
            });
        }

        console.log('Request validated. Getting access token...');
        const token = await getAccessToken();
        
        const timestamp = new Date()
            .toISOString()
            .replace(/[-:TZ]/g, '')
            .slice(0, 14);

        // Format phone number to 2547XXXXXXXX
        const formattedPhone = phone.startsWith('254') ? phone : 
                             phone.startsWith('0') ? `254${phone.substring(1)}` : 
                             `254${phone}`;

        const password = Buffer.from(
            `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
        ).toString('base64');

        console.log('Sending STK push with params:', {
            shortcode: process.env.MPESA_SHORTCODE,
            timestamp,
            phone: formattedPhone,
            amount,
            callbackUrl: process.env.MPESA_CALLBACK_URL
        });

        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: formattedPhone,
                PartyB: process.env.MPESA_SHORTCODE,
                PhoneNumber: formattedPhone,
                CallBackURL: process.env.MPESA_CALLBACK_URL,
                AccountReference: 'PharmacyPayment',
                TransactionDesc: 'Payment for pharmacy products',
            },
            { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 seconds timeout
            }
        );

        console.log('STK Push successful:', response.data);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('STK Push Error:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers,
                data: error.config?.data
            }
        });
        
        res.status(500).json({ 
            error: 'Failed to initiate M-Pesa payment',
            details: error.response?.data || error.message,
            timestamp: new Date().toISOString()
        });
    }
});
// Add this before the export
router.post('/callback', express.json(), (req, res) => {
    console.log('M-Pesa Callback Received:', req.body);
    // Process the callback data here
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
});

export default router;

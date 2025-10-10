import axios from 'axios';
const getMpesaToken = async() => {
    const { data } = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
            auth: {
                username: process.env.MPESA_CONSUMER_KEY,
                password: process.env.MPESA_CONSUMER_SECRET
            }
        }
    );
    return data.access_token;
};

export default getMpesaToken;
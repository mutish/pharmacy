import app from "./app.js";
import dotenv from "dotenv";
import db from "./db/models/index.js";
import axios from "axios";

dotenv.config();

const PORT = process.env.PORT || 3000;
//app.use(express.json());



//DB connection
(async () => {
    try{
        await db.sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch(error){
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
})();

//mpesa access token
async function getAccessToken() {
    const auth = Buffer.from(
      `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
    ).toString("base64");
  
    const res = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );
  
    return res.data.access_token;
}

import app from "./app.js";
import dotenv from "dotenv";
import { sequelize } from "./db/connection.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

//DB connection
(async () => {
    try{
        await sequelize.authenticate();
        console.log("Database connection successful");
        app.listen(PORT, () => {
            console.log(`Backend running at http:localhost:${PORT}`);
        });
    } catch(error){
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
})();

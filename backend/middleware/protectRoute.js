import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({error:"Unauthorised - No token provided"});

        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({error:"Unauthorised -  Invalid token"});

        }

        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(404).json({error: "User not found"});
        }

        req.user = user;
        next();

    } catch (error) {
        console.log("Error in protectRoute middleware:", error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
};

// export const authorize = (...roles) => {
//     return (req, res, next) => {
//         if (!roles.includes(req.user.role)) {
//             return res.status(403).json({
//                 error: `User role ${req.user.role} is not authorized to access this route`
//             });
//         }
//         next();
//     };
// };

export default protectRoute;

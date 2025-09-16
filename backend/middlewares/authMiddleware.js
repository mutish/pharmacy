import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async(req, res, next) => {
  try {
    const token = req.cookies.jwt;
    
    if(!token) {
      return res.status(401).json({error:"Unauthorized - No token provided"});
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if(!decoded) {
      return res.status(401).json({error:"Unauthorized - Invalid token"});
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if(!user) {
      return res.status(404).json({error: "User not found"});
    }

    // Set the user object with the correct ID field
    req.user = {
      id: user.id,
      ...user.get({ plain: true })
    };

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({error: "Invalid token"});
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({error: "Token expired"});
    }
    res.status(500).json({error: "Internal Server Error"});
  }
};

export default protectRoute;

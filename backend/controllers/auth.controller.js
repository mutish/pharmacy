import bcrypt from "bcrypt";
import User from "../models/User.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = new User({
       name,
       email,
       password: hashed,
       role
    });

    if(newUser) {
      //Generate JWT token here
      generateTokenAndSetCookie(newUser.id, res);
      await newUser.save();

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    } else {
      res.status(400).json({ message: "User registration failed" });
    }

    
  } catch (err) {
    console.log("Error in register controller", err.message);
    res.status(500).json({ message: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    const isPasswordValid = await bcrypt.compare(password, user?.password || "");

    if (!user || !isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(user.id, res);

    res.status(200).json({ 
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role 
      }
    });
  } catch (err) {
    console.log("Error in login controller",err.message);
    res.status(500).json({ message: err.message });
  }
}

export async function logout(req, res) {
  try {
    res.cookie("jwt","",{maxAge: 0});
    res.status(200).json({message: "Log Out sucessful"});
  } catch (err) {
    console.log("Error in logout controller", err.message);
    res.status(500).json({err:"Internal Server Error. Check console logs for more"});
    
  }
}

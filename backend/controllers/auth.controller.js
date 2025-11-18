import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/user.model.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';

const buildAuthPayload = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return {
    token,
    user: {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
      gender: user.gender,
      telno: user.telno,
      address: user.address
    }
  };
};

export const signup = async (req, res) => {
    try {
        const { fullname, email, password, confirmPassword, gender }= req.body;

        if(password !== confirmPassword){
            return res.status(400).json({error:"Passwords don't match"})
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({error:"User already exists"})
        }

        const getRoleFromEmail = (email) => {
            const domain = email.split('@')[1];
            if (domain === 'medicare.com') return 'admin';
            if (domain === 'pharma.medicare.com') return 'pharmacist';
            return 'patient';
        };
        const role =  getRoleFromEmail(email);

        //HASH PASSWORD HERE.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${fullname}`;
        const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${fullname}`;

        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
            gender,
            profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
            role,
        })

        if (newUser) {
            //Generate JWT token here.
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();

            console.log("User created successfully");
            res.status(201).json(buildAuthPayload(newUser));
        }else {
            res.status(400).json({error:"Invalid user data"});
        }

    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({error:"Internal server error"})
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({email});
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if(!user || !isPasswordCorrect){
            return res.status(400).json({error:"Invalid email or password"});
        }
        // Generate JWT and set cookie
        generateTokenAndSetCookie(user._id, res);

        console.log("User login successfully. Welcome to the system");
        res.status(200).json(buildAuthPayload(user));

    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({error:"Internal server error"});
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("jwt","", { maxAge:0 });
        console.log("Logout successful");
        res.status(200).json({message:"User logged out successfully"});
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({error:"Internal server error"});
    }
    
};
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude password field
        res.status(200).json(users);
    } catch (error) {
        console.log("Error in getAllUsers controller", error.message);
        res.status(500).json({error:"Internal server error"});
    };
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select("-password");
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

// Delete user account
export const deleteUserAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

export const createUserByAdmin = async (req, res) => {
  try {
    // Only admins reach this controller due to route middleware
    const { fullname, email, password, role, gender, licenseNumber } = req.body;

    if (!fullname || !email || !password || !role || !gender) {
      return res.status(400).json({ message: "fullname, email, password, role and gender are required" });
    }

    const allowedRoles = ["admin", "pharmacist", "patient"];
    if (!allowedRoles.includes(String(role).toLowerCase())) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Prevent duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${fullname}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${fullname}`;

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      gender,
      profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
      role: String(role).toLowerCase(),
      licenseNumber: role === "pharmacist" ? (licenseNumber || "") : ""
    });

    await newUser.save();

    // Return created user (exclude password)
    const created = await User.findById(newUser._id).select("-password");
    res.status(201).json({ message: "User created", user: created });
  } catch (error) {
    console.error("Error in createUserByAdmin controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


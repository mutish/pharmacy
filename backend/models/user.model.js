import mongoose from "mongoose";

const userSchema =  new mongoose.Schema({
    fullname: {
        type:String,
        required: true,
    },
    email:{
        type: String,
        required:true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
        minlength: 6,
    },
    gender: {
        type: String,
        required: true,
        enum: ["male","female"],
    },
    profilePic:{
        type:String,
        default:"",
    },
    userId: {
        type: String,
        unique: true,
        sparse: true
    },
    role:{
        type: String,
        enum: ["admin","pharmacist","patient"],
        default: "patient",
    },
    // Pharmacist-specific (optional)
    licenseNumber: {
        type: String,
        default: ""
    }
}, {timestamps: true});

// Generate custom userId like other resources
userSchema.pre("save", function (next) {
    if (this.isNew && !this.userId) {
        const timestamp = Date.now().toString().slice(-6);
        const rand = Math.random().toString(36).substring(2,5).toUpperCase();
        this.userId = `US${timestamp}${rand}`;
    }
    next();
});

const User = mongoose.model("User", userSchema);

export default User;
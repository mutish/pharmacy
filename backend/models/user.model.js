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
    telno: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    role:{
        type: String,
        enum: ["admin","pharmacist","patient"],
        default: "patient",
    }

}, {timestamps: true});

const User = mongoose.model("User", userSchema);

export default User;
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: function(){
            return !this.isAI; //Not required for AI messages
        }
    },
    receiverId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },
    message:{
        type: String,
        required: true
    },
    // isAI:{
    //     type: Boolean,
    //     default: false
    // },
    // messageType: {
    //     type:String,
    //     enum:["text","prescription","medical_advice","follow_up","ai_response"],
    //     default: "text"
    // },
    messageStatus:{
        type: String,
        enum:["sent","delivered","read"],
        default: "sent"
    },
    // aiModel: {
    //     type:String,
    //     default:null
    // },
    // // //prescription-related messages
    // //     prescriptionRef: {
    // //     type: mongoose.Schema.Types.ObjectId,
    // //     ref: "Prescription",
    // //     default: null
    // // },
    // // For categorizing messages
    // category: {
    //     type: String,
    //     enum: ["general", "medication", "symptoms", "side_effects", "dosage", "other"],
    //     default: "general"
    // }
}, {timestamps: true});

const Message = mongoose.model("Message", messageSchema);

export default Message;
    


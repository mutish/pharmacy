import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    prescriptionId:{
        type:String,
        unique:true,
        required:true
    },
    patientId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    pharmacistId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:false
    },
    uploadedFile: {
        filename: String,
        fileUrl: String,
        fileSize: Number,
        mimetype: String,
        uploadedAt:{
            type:Date,
            default:Date.now,
        },
    },

    //Extracted data
    extractedData: {
    patientName: String,
    issueDate: Date,
    expiryDate: Date,
    medications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        quantity: Number,
      },
    ],
    isExtracted: {
      type: Boolean,
      default: false,
    },
    extractionConfidence: {
      type: Number, // 0-100%
      default: 0,
    },
  },

  // Basic status
  status: {
    type: String,
    enum: ["pending", "under_review", "approved", "rejected"],
    default: "pending",
  },

  // Simple review notes
  reviewNotes: String,
  notes: String,
}, { timestamps: true });


// Generate a simple prescription ID
prescriptionSchema.pre("save", function (next) {
  if (this.isNew) {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.prescriptionId = `RX${timestamp}${rand}`;
  }
  next();
});

export default mongoose.model("Prescription", prescriptionSchema);

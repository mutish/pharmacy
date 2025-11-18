import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    prescriptionId:{
        type:String,
        unique:true
        // removed required:true because it's auto-generated
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
      // added to match controller usage
      rawText: {
        type: String,
        default: ""
      },
      extractionNotes: {
        type: String,
        default: ""
      }
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
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Expose fileUrl at root for UI convenience
prescriptionSchema.virtual("fileUrl").get(function () {
  return this.uploadedFile?.fileUrl || "";
});

// Virtual populate to surface patient as 'user' (aligns with frontend usage)
prescriptionSchema.virtual("user", {
  ref: "User",
  localField: "patientId",
  foreignField: "_id",
  justOne: true
});

// Generate a simple prescription ID
prescriptionSchema.pre("save", function (next) {
  if (this.isNew && !this.prescriptionId) {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.prescriptionId = `RX${timestamp}${rand}`;
  }
  next();
});

export default mongoose.model("Prescription", prescriptionSchema);

import Prescription from '../models/prescription.model.js';
import extractTextFromImage, { extractTextFromPDF } from '../utils/ocr.js';


export const uploadPrescription = async (req, res) => {
  try {
    const patientId = req.user._id;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate a unique prescriptionId
    const prescriptionId = `RX${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const newPrescription = new Prescription({
      prescriptionId,
      patientId,
      // pharmacistId is not set at upload time
      uploadedFile: {
        filename: file.originalname,
        fileUrl: `/uploads/prescriptions/${file.filename}`,
        fileSize: file.size,
        mimetype: file.mimetype,
      },
      status: "pending",
    });

    await newPrescription.save();
    // Wait for extraction to finish before responding
    await processPrescriptionExtraction(newPrescription._id, newPrescription.uploadedFile.fileUrl, newPrescription.uploadedFile.mimetype);

    const populatedPrescription = await Prescription.findById(newPrescription._id)
      .populate('patientId', 'fullname email profilePic telno address gender')
      .lean();

    res.status(201).json({
      success: true,
      message: "Prescription uploaded successfully",
      prescription: populatedPrescription
    });
  } catch (error) {
    console.log("Error in uploadPrescription controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const processPrescriptionExtraction = async (prescriptionId, filePath, mimeType) => {
  try {
    console.log(`Starting OCR processing for prescription: ${prescriptionId}`);
    
    let extractedText = '';
    if (mimeType.startsWith('image/')) {
      extractedText = await extractTextFromImage(filePath);
    } else if (mimeType === 'application/pdf') {
      extractedText = await extractTextFromPDF(filePath);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Log the extracted text for debugging
    console.log(`Extracted OCR text:`, extractedText);

    const extractedData = parsePrescriptionText(extractedText);

    // Log the parsed data for debugging
    console.log(`Parsed extracted data:`, extractedData);

    await Prescription.findByIdAndUpdate(
      prescriptionId,
      {
        $set: {
          "extractedData.patientName": extractedData.patientName,
          "extractedData.issueDate": extractedData.issueDate,
          "extractedData.expiryDate": extractedData.expiryDate,
          "extractedData.medications": extractedData.medications,
          "extractedData.rawText": extractedText,
          "extractedData.isExtracted": true,
          "extractedData.extractionConfidence": calculateConfidence(extractedText),
          "extractedData.extractionNotes": "Automatically extracted via OCR"
        }
      },
      { new: true }
    );

    console.log(`OCR processing completed for prescription: ${prescriptionId}`);

  } catch (error) {
    console.error(`OCR processing failed for prescription ${prescriptionId}:`, error);
    
    // Update prescription with error information
    await Prescription.findByIdAndUpdate(
      prescriptionId,
      {
        $set: {
          "extractedData.extractionNotes": `OCR processing failed: ${error.message}`,
          "extractedData.isExtracted": false,
          "extractedData.extractionConfidence": 0
        }
      }
    );
  }
};

// Text parsing function
const parsePrescriptionText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  const medications = [];
  let currentMed = {};
  let patientName = "Unknown";
  let issueDate = new Date();
  let expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

  // Simple parsing logic - enhance based on your prescription formats
  lines.forEach(line => {
    const cleanLine = line.trim();
    
    // Extract patient name
    if (cleanLine.match(/patient:\s*.+/i) && patientName === "Unknown") {
      patientName = cleanLine.replace(/patient:\s*/i, '').trim();
    }
    if (cleanLine.match(/name:\s*.+/i) && patientName === "Unknown") {
      patientName = cleanLine.replace(/name:\s*/i, '').trim();
    }
    
    // Extract dates
    const dateMatch = cleanLine.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
    if (dateMatch) {
      issueDate = new Date(dateMatch[1]);
    }
    
    // Extract expiry
    if (cleanLine.match(/expir|valid until|until:/i)) {
      const expiryMatch = cleanLine.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
      if (expiryMatch) {
        expiryDate = new Date(expiryMatch[1]);
      }
    }
    
    // Medication detection patterns
    if (cleanLine.match(/\d+\.?\d*\s*(mg|mcg|g|ml|tablet|tab|cap|capsule)\b/i)) {
      if (currentMed.name) {
        medications.push(currentMed);
      }
      currentMed = { name: cleanLine };
    } else if (cleanLine.match(/take|use|apply|once|twice|thrice|daily|weekly|monthly/i) && currentMed.name) {
      currentMed.frequency = cleanLine;
    } else if (cleanLine.match(/\d+\s*(day|week|month)s?/i) && currentMed.name) {
      currentMed.duration = cleanLine;
    } else if (cleanLine.match(/\d+\s*(tab|tablet|capsule|cap|ml|bottle|tube)/i) && currentMed.name) {
      const quantityMatch = cleanLine.match(/(\d+)/);
      currentMed.quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    } else if (cleanLine.match(/with food|empty stomach|before meals|after meals/i) && currentMed.name) {
      currentMed.instructions = cleanLine;
    }
  });

  // Push the last medication
  if (currentMed.name) {
    medications.push(currentMed);
  }

  return {
    patientName,
    issueDate,
    expiryDate,
    medications,
    isExtracted: true
  };
};

// Calculate confidence score based on text quality
const calculateConfidence = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  const hasMedicationTerms = text.match(/\b(mg|tablet|capsule|take|daily|prescription)\b/i);
  const hasNumbers = text.match(/\b\d+\b/);
  const lineCount = lines.length;
  
  let confidence = 0;
  
  if (hasMedicationTerms) confidence += 40;
  if (hasNumbers) confidence += 30;
  if (lineCount > 3) confidence += 30;
  
  return Math.min(confidence, 100);
};

export const verifyPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { reviewNotes } = req.body;
    const pharmacistId = req.user._id;

    // Find the prescription
    const prescription = await Prescription.findOne({ prescriptionId });
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    // Only allow verification if status is pending or under_review
    if (!["pending", "under_review"].includes(prescription.status)) {
      return res.status(400).json({ error: "Prescription cannot be verified in its current status." });
    }

    // Update prescription: set pharmacistId, status, and reviewNotes
    prescription.pharmacistId = pharmacistId;
    prescription.status = "approved";
    if (reviewNotes) prescription.reviewNotes = reviewNotes;

    await prescription.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'fullname email telno')
      .populate('pharmacistId', 'fullname email');

    res.status(200).json({
      success: true,
      message: "Prescription verified and approved.",
      prescription: populatedPrescription
    });
  } catch (error) {
    console.log("Error in verifyPrescription controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};










// import mongoose from 'mongoose';

// // Upload a prescription (for patient or pharmacist)
// export const uploadPrescription = async (req, res) => {
//   try {
//     const { pharmacistId } = req.body;
//     const patientId = req.user._id; // From auth middleware

//     if (!req.file) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "No prescription file uploaded" 
//       });
//     }

//     // Verify pharmacist exists
//     const pharmacist = await User.findById(pharmacistId);
//     if (!pharmacist || !pharmacist.email.includes('@pharmacy.medicare.com')) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid pharmacist ID" 
//       });
//     }

//     const prescription = new Prescription({
//       patientId,
//       pharmacistId,
//       uploadedFile: {
//         filename: req.file.filename,
//         originalName: req.file.originalname,
//         fileUrl: req.file.path,
//         fileSize: req.file.size,
//         mimetype: req.file.mimetype
//       },
//       notes,
//       status: "pending"
//     });

//     await prescription.save();

//     const populatedPrescription = await Prescription.findById(prescription._id)
//       .populate('patientId', 'name email')
//       .populate('pharmacistId', 'name email');

//     res.status(201).json({
//       success: true,
//       message: "Prescription uploaded successfully",
//       prescription: populatedPrescription
//     });

//   } catch (error) {
//     console.error("Upload prescription error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error during prescription upload",
//       error: error.message 
//     });
//   }
// };

// // Get all prescriptions (with role-based filtering)
// export const getAllPrescriptions = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, status, patientId } = req.query;
//     const user = req.user;

//     let filter = {};

//     // Filter based on user role
//     if (user.email.includes('@admin.medicare.com')) {
//       // Admin sees all prescriptions
//       if (status) filter.status = status;
//       if (patientId) filter.patientId = patientId;
//     } else if (user.email.includes('@pharmacy.medicare.com')) {
//       // Pharmacist sees prescriptions assigned to them
//       filter.pharmacistId = user._id;
//       if (status) filter.status = status;
//     } else {
//       // Regular user sees only their prescriptions
//       filter.patientId = user._id;
//       if (status) filter.status = status;
//     }

//     const prescriptions = await Prescription.find(filter)
//       .populate('patientId', 'name email')
//       .populate('pharmacistId', 'name email')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Prescription.countDocuments(filter);

//     res.status(200).json({
//       success: true,
//       prescriptions,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });

//   } catch (error) {
//     console.error("Get prescriptions error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error fetching prescriptions",
//       error: error.message 
//     });
//   }
// };

// // Get single prescription by ID
// export const getPrescriptionById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = req.user;

//     const prescription = await Prescription.findById(id)
//       .populate('patientId', 'name email phone')
//       .populate('pharmacistId', 'name email phone');

//     if (!prescription) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Prescription not found" 
//       });
//     }

//     // Check authorization
//     const isAdmin = user.email.includes('@admin.medicare.com');
//     const isPharmacist = user.email.includes('@pharmacy.medicare.com') && 
//                         prescription.pharmacistId._id.toString() === user._id.toString();
//     const isPatient = prescription.patientId._id.toString() === user._id.toString();

//     if (!isAdmin && !isPharmacist && !isPatient) {
//       return res.status(403).json({ 
//         success: false, 
//         message: "Access denied" 
//       });
//     }

//     res.status(200).json({
//       success: true,
//       prescription
//     });

//   } catch (error) {
//     console.error("Get prescription error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error fetching prescription",
//       error: error.message 
//     });
//   }
// };

// // Update prescription status (Pharmacist/Admin only)
// export const updatePrescriptionStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, reviewNotes, extractedData } = req.body;
//     const user = req.user;

//     const prescription = await Prescription.findById(id);
//     if (!prescription) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Prescription not found" 
//       });
//     }

//     // Check authorization (only pharmacist assigned or admin)
//     const isAdmin = user.email.includes('@admin.medicare.com');
//     const isAssignedPharmacist = user.email.includes('@pharmacy.medicare.com') && 
//                                 prescription.pharmacistId.toString() === user._id.toString();

//     if (!isAdmin && !isAssignedPharmacist) {
//       return res.status(403).json({ 
//         success: false, 
//         message: "Access denied" 
//       });
//     }

//     // Update prescription
//     const updateData = {};
//     if (status) updateData.status = status;
//     if (reviewNotes) updateData.reviewNotes = reviewNotes;
//     if (extractedData) updateData.extractedData = extractedData;

//     const updatedPrescription = await Prescription.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true, runValidators: true }
//     ).populate('patientId', 'name email')
//      .populate('pharmacistId', 'name email');

//     res.status(200).json({
//       success: true,
//       message: "Prescription updated successfully",
//       prescription: updatedPrescription
//     });

//   } catch (error) {
//     console.error("Update prescription error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error updating prescription",
//       error: error.message 
//     });
//   }
// };

// // Delete prescription (Admin only)
// export const deletePrescription = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = req.user;

//     // Only admin can delete
//     if (!user.email.includes('@admin.medicare.com')) {
//       return res.status(403).json({ 
//         success: false, 
//         message: "Access denied. Admin only." 
//       });
//     }

//     const prescription = await Prescription.findById(id);
//     if (!prescription) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Prescription not found" 
//       });
//     }

//     // Delete file from filesystem
//     if (prescription.uploadedFile.fileUrl && fs.existsSync(prescription.uploadedFile.fileUrl)) {
//       fs.unlinkSync(prescription.uploadedFile.fileUrl);
//     }

//     await Prescription.findByIdAndDelete(id);

//     res.status(200).json({
//       success: true,
//       message: "Prescription deleted successfully"
//     });

//   } catch (error) {
//     console.error("Delete prescription error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error deleting prescription",
//       error: error.message 
//     });
//   }
// };

// // Get prescription statistics (Admin/Pharmacist)
// export const getPrescriptionStats = async (req, res) => {
//   try {
//     const user = req.user;

//     if (!user.email.includes('@admin.medicare.com') && !user.email.includes('@pharmacy.medicare.com')) {
//       return res.status(403).json({ 
//         success: false, 
//         message: "Access denied" 
//       });
//     }

//     let matchFilter = {};
//     if (user.email.includes('@pharmacy.medicare.com')) {
//       matchFilter.pharmacistId = user._id;
//     }

//     const stats = await Prescription.aggregate([
//       { $match: matchFilter },
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     const total = await Prescription.countDocuments(matchFilter);

//     res.status(200).json({
//       success: true,
//       stats,
//       total
//     });

//   } catch (error) {
//     console.error("Get prescription stats error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error fetching statistics",
//       error: error.message 
//     });
//   }
// };
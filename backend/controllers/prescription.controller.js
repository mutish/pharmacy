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

// Get all prescriptions
export const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('user', 'fullname email'); // virtual 'user' from schema
    res.status(200).json(prescriptions);
  } catch (error) {
    console.log("Error in getAllPrescriptions controller", error.message);
    res.status(500).json({error:"Internal server error"});
  }
};









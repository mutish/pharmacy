import Prescription from '../models/prescription.model.js';
import mongoose from 'mongoose';

// Upload a prescription (for patient or pharmacist)
export const uploadPrescription = async (req, res) => {
  try {
    const { pharmacistId, notes } = req.body;
    const patientId = req.user._id; // From auth middleware

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No prescription file uploaded" 
      });
    }

    // Verify pharmacist exists
    const pharmacist = await User.findById(pharmacistId);
    if (!pharmacist || !pharmacist.email.includes('@pharmacy.medicare.com')) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid pharmacist ID" 
      });
    }

    const prescription = new Prescription({
      patientId,
      pharmacistId,
      uploadedFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: req.file.path,
        fileSize: req.file.size,
        mimetype: req.file.mimetype
      },
      notes,
      status: "pending"
    });

    await prescription.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'name email')
      .populate('pharmacistId', 'name email');

    res.status(201).json({
      success: true,
      message: "Prescription uploaded successfully",
      prescription: populatedPrescription
    });

  } catch (error) {
    console.error("Upload prescription error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during prescription upload",
      error: error.message 
    });
  }
};

// Get all prescriptions (with role-based filtering)
export const getAllPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, patientId } = req.query;
    const user = req.user;

    let filter = {};

    // Filter based on user role
    if (user.email.includes('@admin.medicare.com')) {
      // Admin sees all prescriptions
      if (status) filter.status = status;
      if (patientId) filter.patientId = patientId;
    } else if (user.email.includes('@pharmacy.medicare.com')) {
      // Pharmacist sees prescriptions assigned to them
      filter.pharmacistId = user._id;
      if (status) filter.status = status;
    } else {
      // Regular user sees only their prescriptions
      filter.patientId = user._id;
      if (status) filter.status = status;
    }

    const prescriptions = await Prescription.find(filter)
      .populate('patientId', 'name email')
      .populate('pharmacistId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(filter);

    res.status(200).json({
      success: true,
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error("Get prescriptions error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching prescriptions",
      error: error.message 
    });
  }
};

// Get single prescription by ID
export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const prescription = await Prescription.findById(id)
      .populate('patientId', 'name email phone')
      .populate('pharmacistId', 'name email phone');

    if (!prescription) {
      return res.status(404).json({ 
        success: false, 
        message: "Prescription not found" 
      });
    }

    // Check authorization
    const isAdmin = user.email.includes('@admin.medicare.com');
    const isPharmacist = user.email.includes('@pharmacy.medicare.com') && 
                        prescription.pharmacistId._id.toString() === user._id.toString();
    const isPatient = prescription.patientId._id.toString() === user._id.toString();

    if (!isAdmin && !isPharmacist && !isPatient) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    res.status(200).json({
      success: true,
      prescription
    });

  } catch (error) {
    console.error("Get prescription error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching prescription",
      error: error.message 
    });
  }
};

// Update prescription status (Pharmacist/Admin only)
export const updatePrescriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, extractedData } = req.body;
    const user = req.user;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ 
        success: false, 
        message: "Prescription not found" 
      });
    }

    // Check authorization (only pharmacist assigned or admin)
    const isAdmin = user.email.includes('@admin.medicare.com');
    const isAssignedPharmacist = user.email.includes('@pharmacy.medicare.com') && 
                                prescription.pharmacistId.toString() === user._id.toString();

    if (!isAdmin && !isAssignedPharmacist) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    // Update prescription
    const updateData = {};
    if (status) updateData.status = status;
    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (extractedData) updateData.extractedData = extractedData;

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('patientId', 'name email')
     .populate('pharmacistId', 'name email');

    res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      prescription: updatedPrescription
    });

  } catch (error) {
    console.error("Update prescription error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error updating prescription",
      error: error.message 
    });
  }
};

// Delete prescription (Admin only)
export const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Only admin can delete
    if (!user.email.includes('@admin.medicare.com')) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin only." 
      });
    }

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ 
        success: false, 
        message: "Prescription not found" 
      });
    }

    // Delete file from filesystem
    if (prescription.uploadedFile.fileUrl && fs.existsSync(prescription.uploadedFile.fileUrl)) {
      fs.unlinkSync(prescription.uploadedFile.fileUrl);
    }

    await Prescription.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Prescription deleted successfully"
    });

  } catch (error) {
    console.error("Delete prescription error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error deleting prescription",
      error: error.message 
    });
  }
};

// Get prescription statistics (Admin/Pharmacist)
export const getPrescriptionStats = async (req, res) => {
  try {
    const user = req.user;

    if (!user.email.includes('@admin.medicare.com') && !user.email.includes('@pharmacy.medicare.com')) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    let matchFilter = {};
    if (user.email.includes('@pharmacy.medicare.com')) {
      matchFilter.pharmacistId = user._id;
    }

    const stats = await Prescription.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Prescription.countDocuments(matchFilter);

    res.status(200).json({
      success: true,
      stats,
      total
    });

  } catch (error) {
    console.error("Get prescription stats error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching statistics",
      error: error.message 
    });
  }
};
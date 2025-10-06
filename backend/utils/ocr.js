import Tesseract from "tesseract.js";
import { PDFParse } from "pdf-parse";
import fs from 'fs';
import path from 'path';

// For image OCR
export const extractTextFromImage = async (imagePath) => {
  try {
    // Always resolve relative to project root, removing leading slash if present
    let relPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const absPath = path.join(process.cwd(), relPath);

    console.log(`Starting image OCR for: ${absPath}`);

    if (!fs.existsSync(absPath)) {
      throw new Error(`File not found: ${absPath}`);
    }

    const { data: { text, confidence } } = await Tesseract.recognize(
      absPath,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR progress: ${m.progress * 100}%`);
          }
        }
      }
    );

    console.log(`Image OCR completed. Confidence: ${confidence}`);

    return text;

  } catch (error) {
    console.error("Image OCR Error:", error);
    throw new Error(`Image OCR processing failed: ${error.message}`);
  }
};

// For PDF OCR
export const extractTextFromPDF = async (pdfPath) => {
  try {
    console.log(`Starting PDF text extraction for: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    // Read PDF file
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Extract text from PDF
    const pdfData = await PDFParse(dataBuffer);
    
    console.log(`PDF text extraction completed. Pages: ${pdfData.numpages}, Text length: ${pdfData.text.length}`);
    
    return pdfData.text;

  } catch (error) {
    console.error("PDF Extraction Error:", error);
    
    // If PDF text extraction fails, try OCR on PDF as image
    console.log("Falling back to OCR for PDF...");
    return await extractTextFromPDFWithOCR(pdfPath);
  }
};

// Fallback: Convert PDF pages to images and OCR them
const extractTextFromPDFWithOCR = async (pdfPath) => {
  // This is a more complex implementation that would require:
  // 1. Converting PDF pages to images (using pdf2pic, pdf-image, etc.)
  // 2. Running OCR on each image
  // 3. Combining the results
  
  // For now, we'll throw an error and suggest implementation
  throw new Error("PDF OCR fallback not implemented. Consider using a service like pdf2pic.");
};

export default extractTextFromImage;
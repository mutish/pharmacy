import Tesseract from "tesseract.js";

export const extractTextFromImage = async (imagePath) => {
        const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
        return text;
};
    
export default extractTextFromImage;
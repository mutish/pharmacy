export const askChatbot = async (message) => {
    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
            {
                headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
                method: "POST",
                body: JSON.stringify({ inputs: message }),
            }
        );
        const data = await response.json();
        console.log("HuggingFace API response:", data); // For debugging
        // Return the array as-is for controller to extract generated_text
        return data;
    } catch (err) {
        console.error("Error calling Huggingface API:", err);
        return null;
    }
};

import Conversation from "../models/conversation.model.js"
import Message from "../models/message.model.js"
import { askChatbot } from "./chatbot.controller.js";

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        // // If the receiver is the chatbot, handle with askChatbot
        // if (receiverId === "chatbot") {
        //     try {
        //         const botResponse = await askChatbot(message);
        //         // HuggingFace returns an array with 'generated_text'
        //         let reply = "Sorry, I couldn't process your request.";
        //         if (Array.isArray(botResponse) && botResponse[0]?.generated_text) {
        //             reply = botResponse[0].generated_text;
        //         }
        //         return res.status(200).json({ reply });
        //     } catch (err) {
        //         console.error("Error in chatbot fetch:", err);
        //         return res.status(500).json({ error: "Chatbot service unavailable. Please try again later." });
        //     }
        // }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }
        const newMessage = new Message({
            senderId,
            receiverId,
            message,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        //SOCKET IO will be here

        //run in parallel
        await Promise.all([conversation.save(), newMessage.save()]);

        res.status(201).json({ message: "Message sent successfully" });

    } catch (error) {
        console.log("Error in sendMessage controller:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMessages = async(req, res) =>{
    try {
        const { id:userToChatId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId]},
        }).populate("messages"); //gives Actual messages.

        if(!conversation){
            return res.status(200).json([]);
        }

        const messages = conversation.messages;

        res.status(200).json(conversation.messages);
    } catch (error) {
        console.log("Error in getMessages controller:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
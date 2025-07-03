
import { Request, Response } from "express";
import { protect } from "../middleware/protect.js";
import { Message } from "../models/message.js";

interface JWTUserData {
  _id: string;
  [key: string]: any;
}

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userData = await protect(req) as JWTUserData;
    
    const ourUserId = userData._id;
    const messages = await Message.find({
      sender: { $in: [userId, ourUserId] },
      recipient: { $in: [userId, ourUserId] },
      deleted: { $ne: true } // Exclude soft-deleted messages
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error in messageController:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userData = await protect(req);
    
    // Find and validate the message
    const message = await Message.findOne({
      _id: messageId,
      sender: userData._id // Only sender can delete
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found or unauthorized" });
    }

    // Soft delete (recommended)
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ 
      success: true, 
      message: "Message deleted successfully",
      deletedMessageId: messageId
    });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// Add this to your backend controller
// controllers/messages.controller.ts
export const clearConversation = async (req: Request, res: Response) => {
  try {
    console.log('Clear conversation endpoint hit'); // Debug log
    const { recipientId } = req.query;
    const userData = await protect(req);
    
    console.log(`Recipient ID: ${recipientId}`); // Debug log
    
    if (!recipientId || typeof recipientId !== 'string') {
      console.log('Invalid recipient ID'); // Debug log
      return res.status(400).json({ 
        success: false,
        message: "Valid recipient ID is required" 
      });
    }

    const result = await Message.updateMany(
      {
        $or: [
          { sender: userData._id, recipient: recipientId },
          { sender: recipientId, recipient: userData._id }
        ]
      },
      {
        $set: {
          deleted: true,
          deletedAt: new Date()
        }
      }
    );

    console.log(`Modified ${result.modifiedCount} messages`); // Debug log
    
    res.json({ 
      success: true,
      message: "Conversation cleared successfully",
      deletedCount: result.modifiedCount
    });
  } catch (error:any) {
    console.error("Error in clearConversation:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};
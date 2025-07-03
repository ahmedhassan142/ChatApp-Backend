

import { Request, Response } from "express";
import { User } from "../models/usermodel.js";
import { Token } from "../models/token.js";

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.query;

    if (!userId || !token) {
      return res.status(400).json({ 
        success: false,
        message: "Missing verification parameters" 
      });
    }

    const verificationToken = await Token.findOneAndDelete({
      userId,
      token,
      expiresAt: { $gt: new Date() }
    });

    if (!verificationToken) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired verification link" 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { verified: true, verificationLinkSent: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: "Email verified successfully" 
    });

  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error during verification" 
    });
  }
};
import bcrypt from "bcrypt";
import crypto from "crypto";

import { Request, Response } from "express";
import { User, validateRegister } from "../models/usermodel.js";
import { Token } from "../models/token.js";
import { sendEmail } from "../utils/sendEmail.js";

interface RegisterRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

 const registercontroller = async (req: Request, res: Response) => {
  try {
    const { error } = validateRegister(req.body as RegisterRequestBody);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let user = await User.findOne({ email: req.body.email });

    if (user && user.verified) {
      return res.status(409).json({ message: "User with given email already exists" });
    }
    
    if (user && user.verificationLinkSent) {
      return res.status(400).json({
        message: "A verification link has been already sent to this Email",
      });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    
    user = await new User({ 
      ...req.body, 
      password: hashPassword 
    }).save();

    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(16).toString("hex"),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    }).save();

   const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verifyemail?userId=${user._id}&token=${token.token}`;
    
    await sendEmail({
      email: user.email,
      subject: "Verify Your Email",
      text: `Please click this link to verify your email: ${verificationUrl}`,
      html: `<p>Please click <a href="${verificationUrl}">this link</a> to verify your email</p>`
    });

    user.verificationLinkSent = true;
    await user.save();
    
    return res.status(201).json({ 
      message: `Verification email sent to ${user.email}` 
    });
  } catch (error) {
    console.error("Error in registerController:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
export default registercontroller;
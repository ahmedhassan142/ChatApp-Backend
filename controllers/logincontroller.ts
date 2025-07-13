import bcrypt from "bcrypt";
// const express=require("express")

import { Request, Response } from "express";
import { User, validateLogin } from "../models/usermodel.js";

interface LoginRequestBody {
  email: string;
  password: string;
}

 // Update your login controller to:
// 1. Return token in both cookie and response body
// 2. Set proper CORS headers

const logincontroller = async (req: Request, res: Response) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).send({ message: "Invalid Email" });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).send({ message: "Invalid Password" });

    if (!user.verified) {
      return res.status(400).send({ message: "Please verify your email first" });
    }

    const token = user.generateAuthToken();
    
    // Set cookie
    res.cookie("authToken", token, {
      httpOnly: true,  // Recommended for security
      // secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // or "strict" for better security
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Also send token in response for clients that prefer that
    res.status(200).json({ 
      message: "Login successful", 
      token, // Optional: only if you want to use token in localStorage
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarLink: user.avatarLink
      }
    });
  } catch (error) {
    console.error("Error in loginController:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
}
export default logincontroller;

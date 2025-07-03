
const express=require("express")
import { Request, Response } from "express";
import { User } from "../models/usermodel";
import { Token } from "../models/token";

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(400).send({ message: "User doesn't exist" });
    }

    if (user.verified) {
      return res.status(400).send({ message: "Email already verified" });
    }

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });

    if (!token) {
      return res.status(400).send({ message: "Invalid Link" });
    }

    // Fix: Convert both to numbers using getTime() for comparison
    if (token.expiresAt.getTime() < Date.now()) {
      user.verificationLinkSent = false;
      await user.save();
      return res.status(400).send({ message: "Verification link has expired" });
    }

    user.verified = true;
    await user.save();

    res.status(200).send({ message: "Email Verified Successfully" });
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
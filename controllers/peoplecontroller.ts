const express=require("express")
import jwt from "jsonwebtoken"

import { Request, Response } from "express";
import { User } from "../models/usermodel.js";

export const peoplecontroller= async (req:Request, res:Response) => {
  try {
    const token = req.cookies?.authToken;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY as string) as { _id: string };
    const currentUserId = decoded._id;

    // Get all users except the current one
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('_id firstName lastName avatarLink email')
      .lean();

    res.json(users);
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ error: "Internal server error" });
  }
}


export default peoplecontroller
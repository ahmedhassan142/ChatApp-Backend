
import { Request, Response } from "express";
import { Avatar } from "../models/avatar.js";

interface AvatarRequestBody {
  link: string;
}

 export const avatarcontroller = async (req: Request, res: Response) => {
  const { link } = req.body as AvatarRequestBody;

  if (!link) {
    return res.status(400).json({ error: "Link is required" });
  }

  try {
    const newAvatar = new Avatar({ link });
    await newAvatar.save();
    return res.status(201).json({ 
      success: true, 
      message: "Avatar link added successfully" 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllAvatars = async (req: Request, res: Response) => {
  try {
    const avatars = await Avatar.find();
    return res.status(200).json({ success: true, avatars });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

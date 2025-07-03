import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "./usermodel.js"; // Assuming you have a User interface

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const tokenSchema: Schema = new Schema<IToken>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User", // Changed to "User" to match typical naming conventions
    unique: true,
  },
  token: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 3600000) // Fixed to use a function
  },
});

// Create the model
export const Token: Model<IToken> = mongoose.model<IToken>("Token", tokenSchema);
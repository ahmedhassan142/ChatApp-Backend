import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "./usermodel.js";

export interface IMessage extends Document {
  sender: Types.ObjectId | IUser;
  recipient: Types.ObjectId | IUser;
  text: string;
  createdAt: Date;
    deleted?: boolean;
  deletedAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
     deleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
  },
  { timestamps: true }
);

export const Message: Model<IMessage> = mongoose.model<IMessage>("Message", MessageSchema);
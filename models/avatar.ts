import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAvatar extends Document {
  link: string;
}

const AvatarSchema = new Schema<IAvatar>(
  {
    link: {
      type: String,
      required: true,
      default: "https://i.imgur.com/qGsYvAK.png",
    },
  },
  { timestamps: true }
);

export const Avatar: Model<IAvatar> = mongoose.model<IAvatar>("Avatar", AvatarSchema);
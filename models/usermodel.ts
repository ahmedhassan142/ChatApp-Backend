import mongoose, { Document, Model, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import Joi from "joi";


export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  verified: boolean;
  verificationLinkSent: boolean;
  avatarLink?: string;
  generateAuthToken: () => string;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verificationLinkSent: { type: Boolean, default: false },
    avatarLink: { type: String },
  },
  { timestamps: true }
);

userSchema.methods.generateAuthToken = function (): string {
  const token = jwt.sign(
    {
      _id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
    },
    process.env.JWTPRIVATEKEY as string,
    { expiresIn: "7d" }
  );
  return token;
};

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export const validateRegister = (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
    password: Joi.string()
      .min(8)
      .max(26)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
      .required()
      .label("Password")
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase, one uppercase, one number, and one special character'
      })
  });
  return schema.validate(data);
};
export const validateLogin = (data: { 
  email: string; 
  password: string 
}) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data); 
};
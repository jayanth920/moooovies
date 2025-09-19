import mongoose, { Schema, model, models } from "mongoose";

const DiscountSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    amount: { type: Number },       // flat discount
    percentage: { type: Number },   // optional percentage discount
    expiresAt: { type: Date },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Discount = models.Discount || model("Discount", DiscountSchema);

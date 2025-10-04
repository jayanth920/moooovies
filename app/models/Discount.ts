import pkg from "mongoose";
const { Schema, model, models } = pkg;

const DiscountSchema = new Schema({
  code: { type: String, required: true, unique: true },
  amount: { type: Number, required: true }, // fixed amount or percentage
  isPercentage: { type: Boolean, default: false },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Discount = models.Discount || model("Discount", DiscountSchema);

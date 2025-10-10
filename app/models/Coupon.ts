import pkg from "mongoose";
const { Schema, model, models } = pkg;

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true },
  price: { type: Number, required: true }, // discount amount
  minQuantity: { type: Number, default: 1 }, // min number of items to apply
  description: { type: String, default: "" }, // e.g., "Get $5 off on 2+ movies"
  expiresAt: { type: Date },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Coupon = models.Coupon || model("Coupon", CouponSchema);

import pkg from "mongoose";
const { Schema, model, models } = pkg;

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true },
  price: { type: Number, required: true }, // discount amount (percent or fixed)
  isPercentage: { type: Boolean, default: false }, // true => percentage-based discount
  minQuantity: { type: Number, default: 1 }, // e.g., buy 2+ movies
  minSubtotal: { type: Number, default: 0 }, // e.g., subtotal >= $50
  minOrderCount: { type: Number, default: 0 }, // e.g., must have placed 0 orders = first order
  description: { type: String, default: "" },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const Coupon = models.Coupon || model("Coupon", CouponSchema);

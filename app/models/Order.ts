import pkg from "mongoose";
const { Schema, model, models } = pkg;

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  movies: [
    {
      movieSnapshot: {
        id: { type: Number, required: true },
        title: { type: String, required: true },
        coverImage: { type: String, required: true },
        price: { type: Number, required: true }, // Original price
        discountPrice: { type: Number }, // Discount price at time of purchase
        description: { type: String }, // Optional
        genre: { type: [String] }, // Changed to array of strings
      },
      quantity: { type: Number, required: true },
      purchasePrice: { type: Number, required: true } // Actual price paid
    }
  ],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  couponSnapshot: {
    code: { type: String },
    description: { type: String },
    discountAmount: { type: Number },
    isPercentage: { type: Boolean },
    originalDiscountValue: { type: Number },
    minQuantity: { type: Number },
    minSubtotal: { type: Number },
    minOrderCount: { type: Number },
    maxOrderCount: { type: Number },
    specificOrderCount: { type: Number }
  },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true }
}, { timestamps: true });

export const Order = models.Order || model("Order", OrderSchema);
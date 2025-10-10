import pkg from "mongoose";
const { Schema, model, models } = pkg;

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  movies: [
    {
      movieId: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true } // price at purchase
    }
  ],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  coupon: { type: Schema.Types.ObjectId, ref: "Coupon" }, // optional applied coupon
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true }
}, { timestamps: true });

export const Order = models.Order || model("Order", OrderSchema);

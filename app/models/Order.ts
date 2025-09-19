import mongoose, { Schema, model, models } from "mongoose";

const OrderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    movies: [
      {
        movieId: { type: Schema.Types.ObjectId, ref: "Movie" },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
      }
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending" }
  },
  { timestamps: true }
);

export const Order = models.Order || model("Order", OrderSchema);

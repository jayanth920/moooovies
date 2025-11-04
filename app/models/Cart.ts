import pkg from "mongoose";
const { Schema, model, models } = pkg;

const CartItemSchema = new Schema({
  movieId: { type: String, required: true }, // CHANGED TO String
  quantity: { type: Number, default: 1 },
});

const CartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [CartItemSchema],
});

export const Cart = models.Cart || model("Cart", CartSchema);
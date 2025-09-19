import mongoose, { Schema, model, models } from "mongoose";

const MovieSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    coverImage: { type: String },
  },
  { timestamps: true }
);

export const Movie = models.Movie || model("Movie", MovieSchema);

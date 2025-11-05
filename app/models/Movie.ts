import pkg from "mongoose";
const { Schema, model, models } = pkg;

const MovieSchema = new Schema(
  {
    // id: { type: Number, unique: true },
    title: { type: String, required: true },

    overview: { type: String },           // main description shown in list page
    description: { type: String },        // optional extended description

    director: { type: String },           // optional
    screenplay: { type: String },         // optional

    pgAge: { type: String, enum: ["G", "PG", "PG-13", "R", "NC-17"], default: "PG" },

    genre: { type: [String], default: [] }, // e.g. ["Action", "Sci-Fi"]
    releaseYear: { type: Number },

    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    price: { type: Number, required: true },
    discountPrice: { type: Number, default: null },

    quantity: { type: Number, required: true },
    coverImage: { type: String },

    featured: { type: Boolean, default: false },
    comingSoon: { type: Boolean, default: false },
    languages: { type: [String], default: [] }, // e.g. ["English", "Hindi"]
  },
  { timestamps: true }
);

export const Movie = models.Movie || model("Movie", MovieSchema);

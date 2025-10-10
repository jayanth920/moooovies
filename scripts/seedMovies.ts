import mongoose from "mongoose";
import { Movie } from "../app/models/Movie";
import { dbConnect } from "../app/lib/dbConnect";
import { movies } from "@/lib/movies";
import * as dotenv from "dotenv";
dotenv.config();

async function seedMovies() {
  await dbConnect();

  await Movie.deleteMany({});
  await Movie.insertMany(movies);

  console.log(`✅ Seeded ${movies.length} movies successfully!`);
  mongoose.connection.close();
}

seedMovies().catch((err) => {
  console.error("❌ Error seeding movies:", err);
  mongoose.connection.close();
});

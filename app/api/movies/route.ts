import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Movie } from "@/app/models/Movie";

/**
 * GET /api/movies
 * Fetches all movies with optional search and filter query params:
 * - title: partial match
 * - minPrice / maxPrice: filter by price range
 * - available: true/false to filter in-stock
 *
 * Example: /api/movies?title=inception&minPrice=10&maxPrice=20&available=true
 */
export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const available = searchParams.get("available");

  const filter: any = {};

  if (title) {
    filter.title = { $regex: title, $options: "i" }; // case-insensitive partial match
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  if (available) {
    filter.quantity = available === "true" ? { $gt: 0 } : 0;
  }

  const movies = await Movie.find(filter);
  return NextResponse.json(movies);
}


/**
 * POST /api/movies
 * Creates new movies or updates existing ones.
 * Accepts either a single movie object or an array of movies.
 * If a movie with the same title already exists, it updates the existing movie.
 *
 * @param {Request} req - The HTTP request containing movie data in JSON.
 * @returns {Promise<NextResponse>} JSON object with status and created/updated movie(s).
 */
export async function POST(req: Request) {
  await dbConnect();
  const data = await req.json();

  try {
    // Helper function to upsert a single movie
    const upsertMovie = async (movieData: any) => {
      // Find movie by title
      const existing = await Movie.findOne({ title: movieData.title });
      if (existing) {
        // Update existing movie with new data
        const updated = await Movie.findByIdAndUpdate(existing._id, movieData, { new: true });
        return { status: "updated", movie: updated };
      } else {
        // Create new movie
        const newMovie = await Movie.create(movieData);
        return { status: "created", movie: newMovie };
      }
    };

    if (Array.isArray(data)) {
      const results = await Promise.all(data.map(upsertMovie));
      return NextResponse.json({ message: "Movies processed", results }, { status: 201 });
    }

    const result = await upsertMovie(data);
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("Error creating/updating movie(s):", error);
    return NextResponse.json({ error: "Failed to process movie(s)" }, { status: 500 });
  }
}

// app/api/movies/byIds/route.ts
import { dbConnect } from "@/app/lib/dbConnect";
import { Movie } from "@/app/models/Movie";

export async function POST(req: Request) {
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return new Response(JSON.stringify({ error: "Missing or invalid ids" }), { status: 400 });
  }

  await dbConnect();

  const movies = await Movie.find({ id: { $in: ids } });

  return new Response(JSON.stringify({ movies }));
}

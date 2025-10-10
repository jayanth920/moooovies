// api/cart/current
import { dbConnect } from "@/app/lib/dbConnect";
import { Cart } from "@/app/models/Cart";
import { Movie } from "@/app/models/Movie";
import { getUserFromToken } from "@/app/lib/middleware";

export async function GET(req: Request) {
  const user = getUserFromToken(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  await dbConnect();

  // Find user's cart
  const cart = await Cart.findOne({ user: user.id });
  if (!cart) {
    return new Response(JSON.stringify({ cart: { items: [] } }));
  }

  // Extract movie IDs from cart items
  const movieIds = cart.items.map((i: any) => i.movieId);

  // Fetch all matching movies from DB, using lean() for plain objects
  const movies = await Movie.find({ id: { $in: movieIds } }).lean();

  // Merge each cart item with its corresponding movie info
  const enrichedItems = cart.items.map((item: any) => ({
    ...item.toObject(),
    movie: movies.find((m) => Number(m.id) === Number(item.movieId)) || null,
  }));

  const enrichedCart = {
    _id: cart._id,
    user: cart.user,
    items: enrichedItems,
  };

  return new Response(JSON.stringify({ cart: enrichedCart }));
}

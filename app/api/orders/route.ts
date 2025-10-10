import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Order } from "@/app/models/Order";
import { Cart } from "@/app/models/Cart";
import { Movie } from "@/app/models/Movie";
import { Coupon } from "@/app/models/Coupon";
import { getUserFromToken } from "@/app/lib/middleware";
import { requireAdmin } from "@/app/lib/auth";

// 🟢 GET – List All Orders (ADMIN ONLY)
export async function GET(req: Request) {
  await dbConnect();

  // ✅ require admin
  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  const orders = await Order.find()
    .populate("userId")
    .sort({ createdAt: -1 });

  return NextResponse.json(orders);
}


// 🟢 POST – Create Order (LOGGED-IN USER OR ADMIN)
const TAX_RATE = 0.08; // 8%

export async function POST(req: Request) {
  await dbConnect();

  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user's cart
  const cart = await Cart.findOne({ user: user.id });
  if (!cart || !cart.items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const data = await req.json(); 
  const couponCode = data.coupon?.toUpperCase(); // optional, from frontend

  // Fetch latest movie data
  const movieIds = cart.items.map((i: any) => i.movieId);
  const movies = await Movie.find({ id: { $in: movieIds } }).lean();

  // Build order items with verified prices
  let subtotal = 0;
  const orderMovies = cart.items.map((item: any) => {
    const movie = movies.find((m: any) => Number(m.id) === Number(item.movieId));
    if (!movie) throw new Error(`Movie with ID ${item.movieId} not found`);

    const price = movie.discountPrice ?? movie.price ?? 0;
    subtotal += price * item.quantity;

    return {
      movieId: movie._id,
      quantity: item.quantity,
      price, // verified price
    };
  });

  // Validate and apply coupon if provided
  let discount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode,
      active: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
    });

    if (coupon) {
      // Validate cart conditions
      const totalQuantity = cart.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
      if ((coupon.minQuantity && totalQuantity < coupon.minQuantity) ||
          (coupon.minSubtotal && subtotal < coupon.minSubtotal)) {
        return NextResponse.json({ error: "Coupon conditions not met" }, { status: 400 });
      }

      discount = coupon.isPercentage ? (subtotal * coupon.price) / 100 : coupon.price;
      appliedCoupon = coupon._id;
    } else {
      return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 400 });
    }
  }

  const tax = (subtotal - discount) * TAX_RATE;
  const total = subtotal - discount + tax;

  // Create the order
  const newOrder = await Order.create({
    userId: user.id,
    movies: orderMovies,
    subtotal,
    tax,
    discount,
    total,
    coupon: appliedCoupon,
  });

  // Optional: clear the cart after order is placed
  await Cart.findByIdAndUpdate(cart._id, { items: [] });

  return NextResponse.json(newOrder, { status: 201 });
}
import { dbConnect } from "@/app/lib/dbConnect";
import { Coupon } from "@/app/models/Coupon";
import { Cart } from "@/app/models/Cart";
import { Movie } from "@/app/models/Movie";
import { Order } from "@/app/models/Order";
import { getUserFromToken } from "@/app/lib/middleware";
import { NextResponse } from "next/server";

const TAX_RATE = 0.08; // 8% fixed tax

export async function GET(req: Request) {
  await dbConnect();

  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
  }

  // Fetch coupon
  const coupon = await Coupon.findOne({
    code,
    active: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } }, // not expired
    ],
  });


  if (!coupon) {
    return NextResponse.json({ valid: false, error: "Invalid or expired coupon" }, { status: 404 });
  }

  // Fetch cart
  const cart = await Cart.findOne({ user: user.id });
  if (!cart || !cart.items.length) {
    return NextResponse.json({ valid: false, error: "Cart is empty" }, { status: 400 });
  }


  // Fetch latest movie prices
  const movieIds = cart.items.map((i: any) => i.movieId);
  const movies = await Movie.find({ id: { $in: movieIds } }).lean();


  // Compute subtotal and total quantity
  let subtotal = 0;
  let totalQuantity = 0;
  cart.items.forEach((item: any) => {
    const movie = movies.find((m: any) => Number(m.id) === Number(item.movieId));
    if (movie) {
      const price = movie.discountPrice ?? movie.price ?? 0;
      subtotal += price * item.quantity;
      totalQuantity += item.quantity;
    }
  });

  // Fetch number of previous orders for the user
  const orderCount = await Order.countDocuments({ userId: user.id });


  // Validate coupon conditions
  if (coupon.minQuantity && totalQuantity < coupon.minQuantity) {
    return NextResponse.json({
      valid: false,
      error: `Requires at least ${coupon.minQuantity} items in cart`,
    }, { status: 400 });
  }

  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return NextResponse.json({
      valid: false,
      error: `Requires minimum subtotal of $${coupon.minSubtotal.toFixed(2)}`,
    }, { status: 400 });
  }

  if (coupon.minOrderCount && orderCount < coupon.minOrderCount) {
    return NextResponse.json({
      valid: false,
      error: `Valid only after ${coupon.minOrderCount} previous orders`,
    }, { status: 400 });
  }

  // Calculate discount amount
  let discountAmount = coupon.price;
  if (coupon.isPercentage) {
    discountAmount = (subtotal * coupon.price) / 100;
  }


  // Calculate tax and total
  const totalAfterDiscount = subtotal - discountAmount;
  const tax = totalAfterDiscount * TAX_RATE;
  const total = totalAfterDiscount + tax;

  
  const obj = {
    valid: true,
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountAmount,
      subtotal,
      tax,
      total,
      totalQuantity,
      orderCount,
    },
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountAmount,
      subtotal,
      tax,
      total,
      totalQuantity,
      orderCount,
    },
  });
}

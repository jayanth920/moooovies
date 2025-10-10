import { dbConnect } from "@/app/lib/dbConnect";
import { Cart } from "@/app/models/Cart";
import { Movie } from "@/app/models/Movie";
import { Coupon } from "@/app/models/Coupon";
import { getUserFromToken } from "@/app/lib/middleware";
import { NextResponse } from "next/server";

const TAX_RATE = 0.08; // 8%

export async function GET(req: Request) {
  await dbConnect();

  const user = getUserFromToken(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const couponCode = url.searchParams.get("coupon")?.toUpperCase();

  // Fetch user's cart
  const cart = await Cart.findOne({ user: user.id });
  if (!cart || !cart.items.length) return NextResponse.json({ cart: { items: [] }, totals: null });

  const movieIds = cart.items.map((i: any) => i.movieId);
  const movies = await Movie.find({ id: { $in: movieIds } }).lean();

  let subtotal = 0;
  let totalQuantity = 0;

  const enrichedItems = cart.items.map((item: any) => {
    const movie = movies.find((m: any) => Number(m.id) === Number(item.movieId));
    const price = movie?.discountPrice ?? movie?.price ?? 0;
    subtotal += price * item.quantity;
    totalQuantity += item.quantity;
    return { ...item.toObject(), movie };
  });

  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode,
      active: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
    });

    if (coupon) {
      // Basic validations (minQuantity, minSubtotal, etc.)
      if ((!coupon.minQuantity || totalQuantity >= coupon.minQuantity) &&
          (!coupon.minSubtotal || subtotal >= coupon.minSubtotal)) {
        discountAmount = coupon.isPercentage ? (subtotal * coupon.price) / 100 : coupon.price;
        appliedCoupon = { code: coupon.code, description: coupon.description, discountAmount };
      }
    }
  }

  const totalAfterDiscount = subtotal - discountAmount;
  const tax = totalAfterDiscount * TAX_RATE;
  const total = totalAfterDiscount + tax;


  const res = {
    cart: { items: enrichedItems },
    totals: {
      subtotal,
      discountAmount,
      tax,
      total,
      appliedCoupon,
      totalQuantity
    }
  }
  
  console.log(res)

  return NextResponse.json({
    cart: { items: enrichedItems },
    totals: {
      subtotal,
      discountAmount,
      tax,
      total,
      appliedCoupon,
      totalQuantity
    }
  });
}

import { dbConnect } from "@/app/lib/dbConnect";
import { Cart } from "@/app/models/Cart";
import { Movie } from "@/app/models/Movie";
import { Coupon } from "@/app/models/Coupon";
import { getUserFromToken } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { Order } from "@/app/models/Order";

const TAX_RATE = 0.08; // 8%

export async function GET(req: Request) {
  await dbConnect();

  const user = getUserFromToken(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const couponCode = url.searchParams.get("coupon")?.toUpperCase();

  // Fetch user's cart
  const cart = await Cart.findOne({ user: user.id });
  if (!cart || !cart.items.length)
    return NextResponse.json({ cart: { items: [] }, totals: null });

  const movieIds = cart.items.map((i: any) => i.movieId);
  const movies = await Movie.find({ id: { $in: movieIds } }).lean();

  let subtotal = 0;
  let totalQuantity = 0;

  const enrichedItems = cart.items.map((item: any) => {
    const movie = movies.find(
      (m: any) => Number(m.id) === Number(item.movieId)
    );
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
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } },
    ],
  });

  if (coupon) {
    // Pull user's previous order count
    const orderCount = await Order.countDocuments({ userId: user.id });



    // TS-safe validations
    const passesMinQuantity =
      coupon.minQuantity == null || totalQuantity >= coupon.minQuantity;
    const passesMinSubtotal =
      coupon.minSubtotal == null || subtotal >= coupon.minSubtotal;
    const passesMinOrderCount =
      coupon.minOrderCount == null || orderCount >= coupon.minOrderCount;
    const passesMaxOrderCount =
      coupon.maxOrderCount == null || orderCount <= coupon.maxOrderCount;
    
    // FIXED: Handle specificOrderCount properly
    // For WELCOME15: specificOrderCount = 0, so it should ONLY pass if orderCount === 0
    const passesSpecificOrderCount =
      coupon.specificOrderCount === null ||
      coupon.specificOrderCount === undefined ||
      orderCount === coupon.specificOrderCount;



    if (
      passesMinQuantity &&
      passesMinSubtotal &&
      passesMinOrderCount &&
      passesMaxOrderCount &&
      passesSpecificOrderCount
    ) {
      discountAmount = coupon.isPercentage
        ? (subtotal * coupon.price) / 100
        : coupon.price;

      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);

      appliedCoupon = {
        code: coupon.code,
        description: coupon.description,
        discountAmount,
      };
    } else {
      console.log('Coupon validation failed for:', coupon.code);
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
      totalQuantity,
    },
  };


  return NextResponse.json({
    cart: { items: enrichedItems },
    totals: {
      subtotal,
      discountAmount,
      tax,
      total,
      appliedCoupon,
      totalQuantity,
    },
  });
}

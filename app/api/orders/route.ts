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
  try {
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

    // Fetch latest movie data to capture current state
    const movieIds = cart.items.map((i: any) => i.movieId);
    const movies = await Movie.find({ id: { $in: movieIds } }).lean();

    // Build order items with complete movie snapshot
    let subtotal = 0;
    const orderMovies = cart.items.map((item: any) => {
      const movie = movies.find((m: any) => Number(m.id) === Number(item.movieId));
      if (!movie) {
        throw new Error(`Movie with ID ${item.movieId} not found`);
      }

      const price = movie.discountPrice ?? movie.price ?? 0;
      subtotal += price * item.quantity;

      // Store complete movie snapshot for historical accuracy
      return {
        movieSnapshot: {
          id: movie.id,
          title: movie.title,
          coverImage: movie.coverImage,
          price: movie.price, // Original price
          discountPrice: movie.discountPrice, // Discount price at time of purchase
          description: movie.description, // If you have this
          genre: movie.genre, // If you have this
        },
        quantity: item.quantity,
        purchasePrice: price, // The actual price paid (discountPrice or regular price)
      };
    });

    // Validate and apply coupon if provided - and snapshot coupon data
    let discount = 0;
    let couponSnapshot = null;

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
        
        // Store complete coupon snapshot for historical accuracy
        couponSnapshot = {
          code: coupon.code,
          description: coupon.description,
          discountAmount: discount, // The actual discount applied
          isPercentage: coupon.isPercentage,
          originalDiscountValue: coupon.price, // The coupon's original discount value
          minQuantity: coupon.minQuantity,
          minSubtotal: coupon.minSubtotal,
          minOrderCount: coupon.minOrderCount,
          maxOrderCount: coupon.maxOrderCount,
          specificOrderCount: coupon.specificOrderCount
        };
      } else {
        return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 400 });
      }
    }

    const tax = (subtotal - discount) * TAX_RATE;
    const total = subtotal - discount + tax;

    // Create the order with complete movie and coupon snapshots
    const newOrder = await Order.create({
      userId: user.id,
      movies: orderMovies,
      subtotal,
      tax,
      discount,
      total,
      couponSnapshot, // Store the snapshot instead of reference
    });

    // Clear the cart after order is placed
    await Cart.findByIdAndUpdate(cart._id, { items: [] });

    return NextResponse.json({ 
      success: true, 
      order: newOrder,
      message: "Order placed successfully" 
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating order:", error);
    
    // Return proper JSON response even for errors
    if (error instanceof Error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
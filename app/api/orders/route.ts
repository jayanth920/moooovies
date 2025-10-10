import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Order } from "@/app/models/Order";
import { requireAdmin } from "@/app/lib/auth";
import { getUserFromToken } from "@/app/lib/middleware";

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
export async function POST(req: Request) {
  await dbConnect();

  // ✅ require user (or admin)
  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json(); // expects { movies: [{ movieId, quantity, price }], discount? }

  // Compute subtotal/tax/total
  const subtotal = data.movies.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.0825;
  const discount = data.discount || 0;
  const total = subtotal + tax - discount;

  const newOrder = await Order.create({
    userId: user.userId, // ✅ use logged-in userId from token
    movies: data.movies,
    subtotal,
    tax,
    discount,
    total
  });

  return NextResponse.json(newOrder, { status: 201 });
}

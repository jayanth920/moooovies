import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Order } from "@/app/models/Order";
import { getUserFromToken } from "@/app/lib/middleware";


export async function GET(req: Request) {
  await dbConnect();

  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Populate movies.movieId and coupon
  const orders = await Order.find({ userId: user.id })
    .populate("movies.movieId")
    .populate("coupon")
    .sort({ createdAt: -1 });

  return NextResponse.json(orders);
}

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Order } from "@/models/Order";
import { getUserFromToken } from "@/lib/middleware";

export async function GET(req: Request) {
  await dbConnect();

  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await Order.find({ userId: user.userId })
    .populate("movies.movieId")
    .sort({ createdAt: -1 });

  return NextResponse.json(orders);
}

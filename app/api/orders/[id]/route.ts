import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Order } from "@/models/Order";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const order = await Order.findById(params.id).populate("movies.movieId");
  return NextResponse.json(order);
}

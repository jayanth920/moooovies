import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Order } from "@/app/models/Order";

export async function GET(req: Request, { params }: any) {
  await dbConnect();
  const order = await Order.findById(params.id).populate("movies.movieId");
  return NextResponse.json(order);
}

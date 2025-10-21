import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Movie } from "@/app/models/Movie";

export async function POST(req: Request) {
  await dbConnect();
  const { ids } = await req.json();
  if (!ids?.length) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
  }
  await Movie.deleteMany({ _id: { $in: ids } });
  return NextResponse.json({ success: true });
}

import { dbConnect } from "@/lib/dbConnect";
import { Discount } from "@/models/Discount";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/middleware";

export async function GET(req: Request, { params }: { params: { code: string } }) {
  await dbConnect();

  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const discount = await Discount.findOne({
    code: params.code,
    active: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } } // not expired
    ]
  });

  if (!discount) {
    return NextResponse.json({ error: "Invalid or expired discount" }, { status: 404 });
  }

  return NextResponse.json(discount);
}

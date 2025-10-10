import { dbConnect } from "@/app/lib/dbConnect";
import { Coupon } from "@/app/models/Coupon";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/app/lib/middleware";

export async function GET(req: Request, { params }: any) {
  await dbConnect();

  const user = getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const coupon = await Coupon.findOne({
    code: params.code,
    active: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } } // not expired
    ]
  });

  if (!coupon) {
    return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 404 });
  }

  return NextResponse.json(coupon);
}

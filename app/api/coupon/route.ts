import { dbConnect } from "@/app/lib/dbConnect";
import { Coupon } from "@/app/models/Coupon";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";

// List all discounts (Admin only)
export async function GET(req: Request) {
  await dbConnect();

  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return NextResponse.json(coupons);
}

// Create a new discount (Admin only)
export async function POST(req: Request) {
  await dbConnect();

  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  try {
    const data = await req.json(); // expects { code, amount, isPercentage?, expiresAt?, active? }
    const newCoupon = await Coupon.create(data);
    return NextResponse.json(Coupon, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}

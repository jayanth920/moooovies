import { dbConnect } from "@/app/lib/dbConnect";
import { Coupon } from "@/app/models/Coupon";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";

// GET – List all coupons (Admin only)
export async function GET(req: Request) {
  await dbConnect();

  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return NextResponse.json(coupons);
}

// POST – Create a new coupon (Admin only)
export async function POST(req: Request) {
  await dbConnect();

  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  try {
    const data = await req.json();
    const newCoupon = await Coupon.create(data);
    return NextResponse.json(newCoupon, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}

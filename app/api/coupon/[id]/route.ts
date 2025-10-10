import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Coupon } from "@/app/models/Coupon";
import { requireAdmin } from "@/app/lib/auth";

// PUT – Update a coupon
export async function PUT(req: NextRequest, { params }: any) {
  await dbConnect();

  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  try {
    const body = await req.json();
    const { amount, isPercentage, expiresAt, active } = body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      params.id,
      { amount, isPercentage, expiresAt, active },
      { new: true, runValidators: true }
    );

    if (!updatedCoupon)
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    return NextResponse.json(updatedCoupon);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// DELETE – Mark inactive OR remove coupon
export async function DELETE(req: NextRequest, { params }: any) {
  await dbConnect();

  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      params.id,
      { active: false },
      { new: true }
    );

    if (!updatedCoupon)
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    return NextResponse.json({
      message: "Coupon deactivated",
      coupon: updatedCoupon,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete coupon" },
      { status: 500 }
    );
  }
}

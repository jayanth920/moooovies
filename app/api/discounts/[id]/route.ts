import { NextResponse } from "next/server"; // same helper we discussed earlier
import { dbConnect } from "@/app/lib/dbConnect";
import { Discount } from "@/app/models/Discount";
import { requireAdmin } from "@/app/lib/auth";

// PUT – Update a discount
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  // ✅ Admin authentication
  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  try {
    const body = await req.json();
    const { amount, isPercentage, expiresAt, active } = body;

    const updatedDiscount = await Discount.findByIdAndUpdate(
      params.id,
      { amount, isPercentage, expiresAt, active },
      { new: true, runValidators: true }
    );

    if (!updatedDiscount)
      return NextResponse.json(
        { error: "Discount not found" },
        { status: 404 }
      );

    return NextResponse.json(updatedDiscount);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update discount" },
      { status: 500 }
    );
  }
}

// DELETE – Mark inactive OR remove discount
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  // ✅ Admin authentication
  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  try {
    // Option 1: Mark as inactive (recommended)
    const updatedDiscount = await Discount.findByIdAndUpdate(
      params.id,
      { active: false },
      { new: true }
    );

    // Option 2: Hard delete (uncomment if you prefer permanent removal)
    // const deletedDiscount = await Discount.findByIdAndDelete(params.id);

    if (!updatedDiscount)
      return NextResponse.json(
        { error: "Discount not found" },
        { status: 404 }
      );

    return NextResponse.json({
      message: "Discount deactivated",
      discount: updatedDiscount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete discount" },
      { status: 500 }
    );
  }
}

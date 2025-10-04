import { dbConnect } from "@/lib/dbConnect";
import { Discount } from "@/models/Discount";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// List all discounts (Admin only)
export async function GET(req: Request) {
  await dbConnect();

  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  const discounts = await Discount.find().sort({ createdAt: -1 });
  return NextResponse.json(discounts);
}

// Create a new discount (Admin only)
export async function POST(req: Request) {
  await dbConnect();

  const admin = requireAdmin(req);
  if (!(admin && typeof admin === "object")) return admin;

  try {
    const data = await req.json(); // expects { code, amount, isPercentage?, expiresAt?, active? }
    const newDiscount = await Discount.create(data);
    return NextResponse.json(newDiscount, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create discount" },
      { status: 500 }
    );
  }
}

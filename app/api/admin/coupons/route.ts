import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Coupon } from "@/app/models/Coupon";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(req: Request) {
  try {
    const authResult = requireAdmin(req);
    if (authResult && (authResult as any).error) {
      return (authResult as any).error;
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const filter: any = {};

    // Search filter
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // Status filter
    if (status === "active") {
      filter.active = true;
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } }
      ];
    } else if (status === "expired") {
      filter.$or = [
        { expiresAt: { $lt: new Date() } }
      ];
    } else if (status === "inactive") {
      filter.active = false;
    }

    // Type filter
    if (type === "percentage") {
      filter.isPercentage = true;
    } else if (type === "fixed") {
      filter.isPercentage = false;
    }

    // Sort options
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const coupons = await Coupon.find(filter)
      .sort(sortOptions)
      .lean();

    return NextResponse.json({
      success: true,
      coupons
    });

  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authResult = requireAdmin(req);
    if (authResult && (authResult as any).error) {
      return (authResult as any).error;
    }

    await dbConnect();
    const data = await req.json();

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: data.code.toUpperCase() });
    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: "Coupon with this code already exists" },
        { status: 400 }
      );
    }

    // Create new coupon
    const couponData = {
      ...data,
      code: data.code.toUpperCase()
    };

    const coupon = await Coupon.create(couponData);

    return NextResponse.json(
      { success: true, coupon },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
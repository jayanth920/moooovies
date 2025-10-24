import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Coupon } from "@/app/models/Coupon";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = requireAdmin(req);
    if (authResult && (authResult as any).error) {
      return (authResult as any).error;
    }

    await dbConnect();

    const coupon = await Coupon.findById(params.id);
    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon
    });

  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = requireAdmin(req);
    if (authResult && (authResult as any).error) {
      return (authResult as any).error;
    }

    await dbConnect();
    const data = await req.json();

    // Check if code is being changed and if it already exists
    if (data.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: data.code.toUpperCase(), 
        _id: { $ne: params.id } 
      });
      if (existingCoupon) {
        return NextResponse.json(
          { success: false, error: "Coupon with this code already exists" },
          { status: 400 }
        );
      }
      data.code = data.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(
      params.id,
      data,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon
    });

  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = requireAdmin(req);
    if (authResult && (authResult as any).error) {
      return (authResult as any).error;
    }

    await dbConnect();

    const coupon = await Coupon.findByIdAndDelete(params.id);
    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
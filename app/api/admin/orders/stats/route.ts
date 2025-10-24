import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Order } from "@/app/models/Order";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(req: Request) {
  try {
    const authResult = requireAdmin(req);
    if (authResult && (authResult as any).error) {
      return (authResult as any).error;
    }

    await dbConnect();

    // Monthly revenue stats
    const monthlyRevenue = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          month: {
            $dateToString: {
              format: "%b %Y",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: 1,
                },
              },
            },
          },
          revenue: 1,
        },
      },
    ]);

    // Coupon usage stats
    const couponUsage = await Order.aggregate([
      { $match: { "couponSnapshot.code": { $exists: true } } },
      {
        $group: {
          _id: "$couponSnapshot.code",
          count: { $sum: 1 },
          totalDiscount: { $sum: "$discount" },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          code: "$_id",
          count: 1,
          totalDiscount: 1,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        monthlyRevenue,
        couponUsage,
      },
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order statistics" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Order } from "@/app/models/Order";
import { Movie } from "@/app/models/Movie";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(req: Request) {
  try {
    const authResult = requireAdmin(req);
    if (authResult && (authResult as any).error) {
      return (authResult as any).error;
    }

    await dbConnect();

    // Updated movie stats API - handles both id and _id
    const movieStats = await Order.aggregate([
      { $unwind: "$movies" },
      {
        $group: {
          // Use _id if available, otherwise fall back to id
          _id: {
            $cond: {
              if: { $ifNull: ["$movies.movieSnapshot._id", false] },
              then: "$movies.movieSnapshot._id",
              else: "$movies.movieSnapshot.id",
            },
          },
          title: { $first: "$movies.movieSnapshot.title" },
          coverImage: { $first: "$movies.movieSnapshot.coverImage" },
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$movies.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$movies.quantity", "$movies.purchasePrice"] },
          },
          // Track which ID type we're using
          idType: {
            $first: {
              $cond: {
                if: { $ifNull: ["$movies.movieSnapshot._id", false] },
                then: "_id",
                else: "id",
              },
            },
          },
        },
      },
      {
        $project: {
          movieId: "$_id",
          title: 1,
          coverImage: 1,
          totalOrders: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          idType: 1, // Useful for debugging
          _id: 0,
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    // Get overall statistics
    const overallStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          averageOrderValue: { $avg: "$total" },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      movieStats,
      overall: overallStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching movie statistics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch movie statistics",
      },
      { status: 500 }
    );
  }
}

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

    // Get movie order statistics - FIXED VERSION
    const movieStats = await Order.aggregate([
      { $unwind: "$movies" },
      {
        $group: {
          _id: "$movies.movieSnapshot.id", // Use the numeric ID from movieSnapshot
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$movies.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$movies.quantity", "$movies.purchasePrice"] }, // Use purchasePrice, not price
          },
        },
      },
      {
        $lookup: {
          from: "movies",
          localField: "_id", // This is the numeric ID
          foreignField: "id", // Match with the numeric 'id' field in Movie model
          as: "movieDetails",
        },
      },
      { $unwind: { path: "$movieDetails", preserveNullAndEmptyArrays: true } }, // Handle movies that might be deleted
      {
        $project: {
          movieId: "$_id",
          title: { 
            $ifNull: ["$movieDetails.title", "Unknown Movie (Deleted)"] 
          },
          totalOrders: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          _id: 0,
        },
      },
      { $sort: { totalQuantity: -1 } }, // Sort by most purchased
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

    console.log("Movie stats found:", movieStats.length);
    console.log("Overall stats:", overallStats[0]);

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
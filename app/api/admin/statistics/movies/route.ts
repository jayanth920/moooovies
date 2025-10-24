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

    // If we get here, user is authenticated admin
    const adminUser = authResult;
    console.log("Fetching statistics for admin user ID:", adminUser.id);

    await dbConnect();

    // Get movie order statistics
    const movieStats = await Order.aggregate([
      { $unwind: "$movies" },
      {
        $group: {
          _id: "$movies.movieId",
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$movies.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$movies.quantity", "$movies.price"] },
          },
        },
      },
      {
        $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movieDetails",
        },
      },
      { $unwind: "$movieDetails" },
      {
        $project: {
          movieId: "$_id",
          title: "$movieDetails.title",
          totalOrders: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          _id: 0,
        },
      },
      { $sort: { totalOrders: -1 } },
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

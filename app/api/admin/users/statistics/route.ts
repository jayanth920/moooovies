import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import { Order } from "@/app/models/Order";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(req: Request) {
  try {
    const authResult = requireAdmin(req);
    if (authResult && (authResult as any).error) {
      return (authResult as any).error;
    }

    await dbConnect();

    // Get user growth statistics (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get user role statistics
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get user status statistics
    const statusStats = await User.aggregate([
      {
        $group: {
          _id: "$active",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get top users by orders
    const topUsers = await Order.aggregate([
      {
        $group: {
          _id: "$userId",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          userId: "$_id",
          name: "$user.name",
          email: "$user.email",
          totalOrders: 1,
          totalSpent: 1,
          _id: 0,
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Overall statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ active: true });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalOrders = await Order.countDocuments();

    return NextResponse.json({
      success: true,
      statistics: {
        userGrowth,
        roleStats,
        statusStats,
        topUsers,
        overall: {
          totalUsers,
          activeUsers,
          totalAdmins,
          totalOrders,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}

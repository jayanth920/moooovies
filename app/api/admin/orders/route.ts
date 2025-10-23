import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Order } from "@/app/models/Order";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(req: Request) {
  try {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    
    // Advanced filters
    const minItems = searchParams.get("minItems");
    const maxItems = searchParams.get("maxItems");
    const minMovies = searchParams.get("minMovies");
    const maxMovies = searchParams.get("maxMovies");
    const minTotal = searchParams.get("minTotal");
    const maxTotal = searchParams.get("maxTotal");
    const hasCoupon = searchParams.get("hasCoupon");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build aggregation pipeline
    const pipeline: any[] = [
      // Lookup user data first
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData"
        }
      },
      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: true
        }
      },
      // Calculate items and movies counts
      {
        $addFields: {
          totalItems: {
            $sum: "$movies.quantity"
          },
          totalMovies: {
            $size: "$movies"
          },
          // Add shortId field for searching
          shortId: {
            $substrCP: [
              { $toString: "$_id" },
              { $subtract: [{ $strLenCP: { $toString: "$_id" } }, 6] },
              6
            ]
          }
        }
      }
    ];

    // Build match stage for all filters
    const matchStage: any = {};

    // Search filter
    if (search) {
      const cleanSearch = search.replace(/^#/, '');
      
      matchStage.$or = [
        { "userData.name": { $regex: search, $options: "i" } },
        { "userData.email": { $regex: search, $options: "i" } },
        { "shortId": { $regex: cleanSearch, $options: "i" } }
      ];
    }

    // Items count filter
    if (minItems || maxItems) {
      matchStage.totalItems = {};
      if (minItems) matchStage.totalItems.$gte = parseInt(minItems);
      if (maxItems) matchStage.totalItems.$lte = parseInt(maxItems);
    }

    // Movies count filter
    if (minMovies || maxMovies) {
      matchStage.totalMovies = {};
      if (minMovies) matchStage.totalMovies.$gte = parseInt(minMovies);
      if (maxMovies) matchStage.totalMovies.$lte = parseInt(maxMovies);
    }

    // Total price filter
    if (minTotal || maxTotal) {
      matchStage.total = {};
      if (minTotal) matchStage.total.$gte = parseFloat(minTotal);
      if (maxTotal) matchStage.total.$lte = parseFloat(maxTotal);
    }

    // Coupon filter
    if (hasCoupon !== "") {
      if (hasCoupon === "true") {
        matchStage.discount = { $gt: 0 };
      } else if (hasCoupon === "false") {
        matchStage.discount = { $eq: 0 };
      }
    }

    // Date range filter
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    // Add match stage if we have any filters
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add pagination and sorting
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          shortId: 1,
          userId: {
            _id: "$userData._id",
            name: "$userData.name",
            email: "$userData.email"
          },
          movies: 1,
          subtotal: 1,
          tax: 1,
          discount: 1,
          total: 1,
          couponSnapshot: 1,
          createdAt: 1,
          totalItems: 1,
          totalMovies: 1
        }
      }
    );

    // Get orders with filters and pagination
    const orders = await Order.aggregate(pipeline);

    // Get total count for pagination (without pagination stages)
    let countPipeline: any[] = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData"
        }
      },
      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          totalItems: {
            $sum: "$movies.quantity"
          },
          totalMovies: {
            $size: "$movies"
          },
          // Add shortId field for counting too
          shortId: {
            $substrCP: [
              { $toString: "$_id" },
              { $subtract: [{ $strLenCP: { $toString: "$_id" } }, 6] },
              6
            ]
          }
        }
      }
    ];

    // Add the same match stage for counting
    if (Object.keys(matchStage).length > 0) {
      countPipeline.push({ $match: matchStage });
    }

    countPipeline.push({ $count: "total" });

    const countResult = await Order.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import { requireAdmin } from "@/app/lib/auth";
import { Order } from "@/app/models/Order";

export async function GET(req: Request) {
  try {
const authResult = requireAdmin(req);
if (authResult && (authResult as any).error) {
  return (authResult as any).error;
}

    // If we get here, authResult is the user payload
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const filter: any = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Role filter
    if (role) {
      filter.role = role;
    }

    // Status filter
    if (status === "active") {
      filter.active = true;
    } else if (status === "inactive") {
      filter.active = false;
    }

    // Sort options
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get users with orders count using aggregation
    const users = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "orders", // Make sure this matches your MongoDB collection name
          localField: "_id",
          foreignField: "userId",
          as: "userOrders"
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          active: 1,
          createdAt: 1,
          updatedAt: 1,
          orders: "$userOrders", // This will contain the actual orders
          ordersCount: { $size: "$userOrders" }
        }
      },
      { $sort: sortOptions }
    ]);

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authResult = requireAdmin(req);
    
    // Check if auth returned an error
    if (authResult && (authResult as any).error) {
      return (authResult as any).error;
    }

    await dbConnect();
    const data = await req.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create(data);
    const userWithoutPassword = await User.findById(user._id).select("-passwordHash");

    return NextResponse.json(
      { success: true, user: userWithoutPassword },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
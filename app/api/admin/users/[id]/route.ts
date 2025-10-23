import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import { requireAdmin } from "@/app/lib/auth";
import bcrypt from "bcryptjs";
import { Order } from "@/app/models/Order";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();
    const { id } = await params;

    // Get user basic info
    const user = await User.findById(id).select("-passwordHash");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's orders with full details
    const orders = await Order.find({ userId: id })
      .populate("movies.movieId", "title")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrder = orders.length > 0 ? totalSpent / orders.length : 0;
    const lastOrder = orders.length > 0 ? orders[0].createdAt : null;

    return NextResponse.json({
      success: true,
      user: {
        ...user.toObject(),
        orders,
        ordersCount: orders.length,
        stats: {
          totalSpent,
          averageOrder,
          lastOrder
        }
      }
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();
    const { id } = await params; // Add await here
    const data = await req.json();

    // Check if email already exists (for other users)
    if (data.email) {
      const existingUser = await User.findOne({ 
        email: data.email, 
        _id: { $ne: id } 
      });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Handle password reset
    if (data.password) {
      if (data.password.trim() === "") {
        // If password is empty string, don't update it
        delete data.password;
      } else {
        // Hash new password
        data.passwordHash = await bcrypt.hash(data.password, 10);
        delete data.password;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();
    const { id } = await params; // Add await here

    // Prevent admin from deleting themselves
    if (authResult.id === id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Find user first to check role
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of admin accounts
    if (user.role === "admin") {
      return NextResponse.json(
        { success: false, error: "Cannot delete admin accounts" },
        { status: 400 }
      );
    }

    // Permanently delete user (only non-admins reach here)
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "User permanently deleted successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Error permanently deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to permanently delete user" },
      { status: 500 }
    );
  }
}
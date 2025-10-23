import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import { Order } from "@/app/models/Order";
import { Cart } from "@/app/models/Cart"; // Add this import
import { requireAdmin } from "@/app/lib/auth";

// Add proper type for params
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
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

    // Find user first to return data
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

    // Delete user's orders
    await Order.deleteMany({ userId: id });

    // Delete user's cart
    await Cart.deleteMany({ user: id });

    // Permanently delete user
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "User permanently deleted successfully along with all their orders and cart items",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error permanently deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to permanently delete user" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import { requireAdmin } from "@/app/lib/auth";

// Add proper type for params
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();
    const { id } = await params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent admin from deactivating themselves
    if (authResult.id === id) {
      return NextResponse.json(
        { success: false, error: "Cannot modify your own account" },
        { status: 400 }
      );
    }

    // Prevent deactivation of admin accounts
    if (user.role === "admin") {
      return NextResponse.json(
        { success: false, error: "Cannot modify admin accounts" },
        { status: 400 }
      );
    }

    // Toggle the active status
    const newStatus = !user.active;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { active: newStatus },
      { new: true }
    ).select("-passwordHash");

    const action = newStatus ? "activated" : "deactivated";

    return NextResponse.json({
      success: true,
      message: `User ${action} successfully`,
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user status" },
      { status: 500 }
    );
  }
}
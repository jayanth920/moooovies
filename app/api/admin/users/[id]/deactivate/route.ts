import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import { requireAdmin } from "@/app/lib/auth";

export async function POST(req: Request, { params }: any) {
  try {
    const authResult = requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();
    const { id } = params;
    const { action } = await req.json(); // Get action from request body

    // Prevent admin from deactivating themselves
    if (authResult.id === id && action === "deactivate") {
      return NextResponse.json(
        { success: false, error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deactivation of admin accounts
    if (user.role === "admin" && action === "deactivate") {
      return NextResponse.json(
        { success: false, error: "Cannot deactivate admin accounts" },
        { status: 400 }
      );
    }

    const newStatus = action === "deactivate" ? false : true;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { active: newStatus },
      { new: true }
    ).select("-passwordHash");

    return NextResponse.json({
      success: true,
      message: `User ${action === "deactivate" ? "deactivated" : "activated"} successfully`,
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
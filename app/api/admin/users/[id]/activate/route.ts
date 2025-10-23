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

    const activatedUser = await User.findByIdAndUpdate(
      id,
      { active: true },
      { new: true }
    ).select("-passwordHash");

    if (!activatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User activated successfully",
      user: activatedUser
    });

  } catch (error) {
    console.error("Error activating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to activate user" },
      { status: 500 }
    );
  }
}
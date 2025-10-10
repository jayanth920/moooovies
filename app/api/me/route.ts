import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import { getUserFromToken } from "@/app/lib/middleware";

export async function GET(req: Request) {
  await dbConnect();

  // Get user info from token
  const authUser = getUserFromToken(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = authUser.id;

  // Fetch the user from DB, exclude password hash
  const user = await User.findById(userId).select("-passwordHash");
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      orders: user.orders,
      active: user.active,
    },
  });
}

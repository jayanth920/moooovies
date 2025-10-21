import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import { getUserFromToken } from "@/app/lib/middleware";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  await dbConnect();

  const authUser = getUserFromToken(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findById(authUser.id).select("-passwordHash");
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

export async function PUT(req: Request) {
  await dbConnect();

  const authUser = getUserFromToken(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, password } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // Check if email is taken by another user
  const existing = await User.findOne({ email, _id: { $ne: authUser.id } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const updateData: any = { name, email };
  if (password?.trim()) {
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(password, salt);
  }

  const updatedUser = await User.findByIdAndUpdate(authUser.id, updateData, { new: true }).select("-passwordHash");

  return NextResponse.json({
    user: {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      orders: updatedUser.orders,
      active: updatedUser.active,
    },
  });
}

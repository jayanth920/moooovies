import { getUserFromToken } from "@/app/lib/middleware";
import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// GET a user by ID (self or admin only)
export async function GET(_: Request, { params }: any) {
  await dbConnect();

  // Authenticate request from token
  const authUser = getUserFromToken(_);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  // Only allow user to fetch their own profile, or admins to fetch anyone
  if (authUser.id !== id && authUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Exclude password hash when returning user
  const user = await User.findById(id).select("-passwordHash");
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

// UPDATE a user by ID (self or admin only)
export async function PUT(
  req: Request,
  { params }: any
) {
  await dbConnect();

  const authUser = getUserFromToken(req);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  // Only allow self update, or admin update
  if (authUser.id !== id && authUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();

  // If password is included, hash it before saving
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  // Return updated user, without passwordHash
  const updatedUser = await User.findByIdAndUpdate(id, data, {
    new: true,
  }).select("-passwordHash");

  if (!updatedUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ message: "User updated", user: updatedUser });
}

// DELETE (soft-delete) a user by ID (admin only)
export async function DELETE(
  _: Request,
  { params }: any
) {
  await dbConnect();

  const authUser = getUserFromToken(_);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins can deactivate users
  if (authUser.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;

  // Instead of removing, just mark user as inactive
  const deletedUser = await User.findByIdAndUpdate(
    id,
    { active: false },
    { new: true }
  ).select("-passwordHash");

  if (!deletedUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ message: "User deactivated", user: deletedUser });
}

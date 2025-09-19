import { getUserFromToken } from "@/lib/middleware";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const authUser = getUserFromToken(_);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  if (authUser.id !== id && authUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await User.findById(id).select("-passwordHash");
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  const authUser = getUserFromToken(req);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  if (authUser.id !== id && authUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  const updatedUser = await User.findByIdAndUpdate(id, data, {
    new: true,
  }).select("-passwordHash");
  if (!updatedUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ message: "User updated", user: updatedUser });
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  const authUser = getUserFromToken(_);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (authUser.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;

  // Soft delete: mark user as inactive
  const deletedUser = await User.findByIdAndUpdate(
    id,
    { active: false },
    { new: true }
  ).select("-passwordHash");
  if (!deletedUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ message: "User deactivated", user: deletedUser });
}

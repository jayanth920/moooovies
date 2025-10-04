import { getUserFromToken } from "@/app/lib/middleware";
import { dbConnect } from "@/app/lib/dbConnect";
import { NextResponse } from "next/server";
import { User } from "@/app/models/User";

export async function GET(req: Request) {
  await dbConnect();

  const authUser = getUserFromToken(req);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (authUser.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await User.find({}).select("-passwordHash");
  return NextResponse.json({ users });
}

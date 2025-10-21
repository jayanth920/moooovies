import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { User } from "@/app/models/User";
import { getUserFromToken } from "@/app/lib/middleware";

export async function GET(req: Request) {
  await dbConnect();

  // Check logged-in user
  const authUser = getUserFromToken(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email query is required" }, { status: 400 });
  }

  // Check if email exists for **any user other than current**
  const exists = await User.exists({ email: email.toLowerCase(), _id: { $ne: authUser.id } });

  return NextResponse.json({ available: !exists });
}

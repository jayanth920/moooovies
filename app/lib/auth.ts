import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function requireAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });

  const token = authHeader.split(" ")[1]; // Bearer <token>
  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET as string);
    if (payload.role !== "admin") throw new Error("Not admin");
    return payload; // contains userId, role, etc
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}

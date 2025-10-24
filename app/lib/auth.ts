import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const getUserFromToken = (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
};

export function requireAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return { error: NextResponse.json({ error: "No token" }, { status: 401 }) };
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>
  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET as string);
    if (payload.role !== "admin") {
      return { error: NextResponse.json({ error: "Unauthorized access - Admin privileges required" }, { status: 403 }) };
    }
    return payload; // contains userId, role, etc
  } catch (err) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 403 }) };
  }
}
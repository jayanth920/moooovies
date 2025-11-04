import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Cart } from "@/app/models/Cart";
import { getUserFromToken } from "@/app/lib/middleware";

// GET /api/cart
export async function GET(req: Request) {
  const user = getUserFromToken(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const cart = await Cart.findOne({ user: user.id });
  return NextResponse.json({ cart });
}

// POST /api/cart
export async function POST(req: Request) {
  const user = getUserFromToken(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized Person" }, { status: 401 });

  const { movieId, quantity = 1 } = await req.json();
  if (!movieId)
    return NextResponse.json({ error: "Missing movieId" }, { status: 400 });

  await dbConnect();

  let cart = await Cart.findOne({ user: user.id });

  if (!cart) {
    cart = await Cart.create({ user: user.id, items: [{ movieId, quantity }] });
  } else {
    // Use String comparison since movieId is now ObjectId string
    const existingItem = cart.items.find((i: any) => String(i.movieId) === String(movieId));
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ movieId, quantity });
    }
    await cart.save();
  }

  return NextResponse.json({ cart });
}

// PATCH /api/cart
export async function PATCH(req: Request) {
  const user = getUserFromToken(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { movieId, quantity } = await req.json();
  if (!movieId || quantity == null)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await dbConnect();

  const cart = await Cart.findOne({ user: user.id });
  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  // Use String comparison
  const item = cart.items.find((i: any) => String(i.movieId) === String(movieId));
  if (!item) return NextResponse.json({ error: "Movie not in cart" }, { status: 404 });

  item.quantity = quantity;
  await cart.save();

  return NextResponse.json({ cart });
}

// DELETE /api/cart
export async function DELETE(req: Request) {
  const user = getUserFromToken(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { movieId } = await req.json();
  if (!movieId)
    return NextResponse.json({ error: "Missing movieId" }, { status: 400 });

  await dbConnect();

  const cart = await Cart.findOne({ user: user.id });
  if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  // Use String comparison
  cart.items = cart.items.filter((i: any) => String(i.movieId) !== String(movieId));
  await cart.save();

  return NextResponse.json({ cart });
}
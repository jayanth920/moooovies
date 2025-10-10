import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Cart } from "@/app/models/Cart";
import { getUserFromToken } from "@/app/lib/middleware";

// GET /api/cart
export async function GET(req: Request) {
  const user = getUserFromToken(req);
  if (!user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  await dbConnect();

  const cart = await Cart.findOne({ user: user.id });
  return new Response(JSON.stringify({ cart }));
}

// POST /api/cart
export async function POST(req: Request) {
  const user = getUserFromToken(req);
  if (!user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { movieId, quantity = 1 } = await req.json();
  if (!movieId)
    return new Response(JSON.stringify({ error: "Missing movieId" }), { status: 400 });

  await dbConnect();

  let cart = await Cart.findOne({ user: user.id });

  if (!cart) {
    cart = await Cart.create({ user: user.id, items: [{ movieId, quantity }] });
  } else {
    const existingItem = cart.items.find((i: any) => i.movieId === movieId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ movieId, quantity });
    }
    await cart.save();
  }

  return new Response(JSON.stringify({ cart }));
}

// PATCH /api/cart
export async function PATCH(req: Request) {
  const user = getUserFromToken(req);
  if (!user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { movieId, quantity } = await req.json();
  if (!movieId || quantity == null)
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });

  await dbConnect();

  const cart = await Cart.findOne({ user: user.id });
  if (!cart) return new Response(JSON.stringify({ error: "Cart not found" }), { status: 404 });

  const item = cart.items.find((i: any) => i.movieId === movieId);
  if (!item) return new Response(JSON.stringify({ error: "Movie not in cart" }), { status: 404 });

  item.quantity = quantity;
  await cart.save();

  return new Response(JSON.stringify({ cart }));
}

// DELETE /api/cart
export async function DELETE(req: Request) {
  const user = getUserFromToken(req);
  if (!user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { movieId } = await req.json();
  if (!movieId)
    return new Response(JSON.stringify({ error: "Missing movieId" }), { status: 400 });

  await dbConnect();

  const cart = await Cart.findOne({ user: user.id });
  if (!cart) return new Response(JSON.stringify({ error: "Cart not found" }), { status: 404 });

  cart.items = cart.items.filter((i: any) => i.movieId !== movieId);
  await cart.save();

  return new Response(JSON.stringify({ cart }));
}

// EXISTING MOVIE: GET by ID, PUT update, DELETE movie

import { NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/dbConnect";
import { Movie } from "@/app/models/Movie";

export async function GET(_: Request, { params }: any) {
  await dbConnect();
  const movie = await Movie.findById(params.id);
  if (!movie) return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  return NextResponse.json(movie);
}

export async function PUT(req: Request, { params }: any) {
  await dbConnect();
  const data = await req.json();
  const updated = await Movie.findByIdAndUpdate(params.id, data, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: any) {
  await dbConnect();
  await Movie.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "Movie deleted" });
}

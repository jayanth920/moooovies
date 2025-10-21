"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star } from "lucide-react";

export default function MovieDetailPage() {
    const { id } = useParams();
    const [movie, setMovie] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<number[]>([]);
    const [adding, setAdding] = useState(false);

    // Fetch single movie
    const fetchMovie = async () => {
        try {
            const res = await fetch(`/api/movies/${id}`);
            const data = await res.json();
            setMovie(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch cart
    const fetchCart = async () => {
        try {
            const res = await fetch("/api/cart", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            setCart(data.cart?.items?.map((i: any) => i.movieId) || []);
        } catch (err) {
            console.error(err);
        }
    };

    // Add to Cart
    const addToCart = async (movieId: number) => {
        try {
            setAdding(true);
            await fetch("/api/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ movieId, quantity: 1 }),
            });
            setCart((prev) => [...prev, movieId]);
        } catch (err) {
            console.error(err);
        } finally {
            setAdding(false);
        }
    };

    useEffect(() => {
        fetchMovie();
        fetchCart();
    }, [id]);

    if (loading) return <div className="flex justify-center items-center h-[70vh]">Loading movie...</div>;
    if (!movie) return <div className="text-center text-gray-600 mt-10">Movie not found.</div>;

    const isInCart = cart.includes(movie.id);

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Poster */}
                <img
                    src={movie.coverImage || "https://via.placeholder.com/300x450?text=No+Image"}
                    alt={movie.title}
                    className="rounded-2xl shadow-lg w-full md:w-[320px] h-auto"
                />

                {/* Info */}
                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-3">{movie.title}</h1>
                    <p className="text-gray-600 mb-4 italic">{movie.releaseYear}</p>
                    <div className="flex items-center gap-2 mb-2">
                        <Star size={20} className="text-yellow-500" />
                        <span className="font-semibold">{movie.rating.average.toFixed(1)} / 10</span>
                        <span className="text-gray-500 text-sm">({movie.rating.count} ratings)</span>
                    </div>

                    <p className="text-gray-700 mb-4">{movie.overview}</p>
                    <p className="text-gray-800 mb-4">{movie.description}</p>

                    <p className="mb-2"><span className="font-semibold">Director:</span> {movie.director}</p>
                    <p className="mb-2"><span className="font-semibold">Screenplay:</span> {movie.screenplay}</p>
                    <p className="mb-2"><span className="font-semibold">Genres:</span> {movie.genre.join(", ")}</p>
                    <p className="mb-2"><span className="font-semibold">Languages:</span> {movie.languages?.join(", ")}</p>
                    <p className="mb-2"><span className="font-semibold">Rated:</span> {movie.pgAge}</p>

                    <div className="mt-6 flex items-center gap-4">
                        {movie.discountPrice ? (
                            <>
                                <span className="text-gray-500 line-through text-lg">${movie.price}</span>
                                <span className="text-green-600 text-2xl font-semibold">${movie.discountPrice}</span>
                            </>
                        ) : (
                            <span className="text-2xl font-semibold">${movie.price}</span>
                        )}
                    </div>

                    <button
                        disabled={isInCart || adding || movie.quantity === 0}
                        onClick={() => addToCart(movie.id)}
                        className={`mt-6 px-6 py-2 rounded-lg text-white font-semibold ${isInCart
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {isInCart ? "Added to cart" : adding ? "Adding..." : "Add to Cart"}
                    </button>
                </div>
            </div>
        </div>
    );
}

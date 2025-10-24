"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation"; // 👈 add this


export default function MoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<number[]>([]); // movie IDs in cart

  // Filters
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [comingSoonOnly, setComingSoonOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState("");

  const fetchMovies = async () => {
    try {
      const res = await fetch("/api/movies");
      const data = await res.json();
      setMovies(data.movies || []);
      setFiltered(data.movies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      // store movie IDs in cart for quick lookup
      console.log("CART: ",data)
      setCart(data.cart?.items?.map((i: any) => i.movieId) || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchCart();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let temp = [...movies];
    if (search.trim()) temp = temp.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
    if (genreFilter) temp = temp.filter((m) => m.genre.includes(genreFilter));
    if (languageFilter) temp = temp.filter((m) => m.languages?.includes(languageFilter));
    if (availabilityOnly) temp = temp.filter((m) => m.quantity > 0);
    if (comingSoonOnly) temp = temp.filter((m) => m.comingSoon);
    if (discountOnly) temp = temp.filter((m) => m.discountPrice != null);

    switch (sortBy) {
      case "newest": temp.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "oldest": temp.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "priceLow": temp.sort((a, b) => a.price - b.price); break;
      case "priceHigh": temp.sort((a, b) => b.price - a.price); break;
      case "rating": temp.sort((a, b) => b.rating.average - a.rating.average); break;
    }

    setFiltered(temp);
  }, [search, movies, genreFilter, languageFilter, availabilityOnly, comingSoonOnly, discountOnly, sortBy]);

  const pgBadgeColor = (age: string) => {
    switch (age) {
      case "G": return "bg-green-400 text-white";
      case "PG": return "bg-blue-400 text-white";
      case "PG-13": return "bg-yellow-400 text-black";
      case "R": return "bg-red-500 text-white";
      case "NC-17": return "bg-purple-600 text-white";
      default: return "bg-gray-300 text-black";
    }
  };

  const addToCart = async (movieId: number) => {
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ movieId, quantity: 1 }),
      });
      // update cart state locally
      setCart((prev) => [...prev, movieId]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[70vh]">Loading movies...</div>;

  const allGenres = Array.from(new Set(movies.flatMap((m) => m.genre)));
  const allLanguages = Array.from(new Set(movies.flatMap((m) => m.languages || [])));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Movies 🎬</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input type="text" placeholder="Search movies..." value={search} onChange={(e) => setSearch(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md" />
        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
          <option value="">All Genres</option>
          {allGenres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
          <option value="">All Languages</option>
          {allLanguages.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <label className="flex items-center gap-1"><input type="checkbox" checked={availabilityOnly} onChange={() => setAvailabilityOnly(!availabilityOnly)} />Available Only</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={comingSoonOnly} onChange={() => setComingSoonOnly(!comingSoonOnly)} />Coming Soon</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={discountOnly} onChange={() => setDiscountOnly(!discountOnly)} />Discounted</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
          <option value="">Sort By</option>
          <option value="newest">Newest Releases</option>
          <option value="oldest">Oldest Releases</option>
          <option value="priceLow">Price: Low → High</option>
          <option value="priceHigh">Price: High → Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Movies Flex Container */}
      <div className="flex flex-wrap justify-center gap-6">
        {filtered.length === 0 ? <p>No movies found.</p> : filtered.map((movie) => {
          const isInCart = cart.includes(movie.id);
          return (
            <div key={movie._id} className="bg-white rounded-xl shadow hover:shadow-lg transition relative flex flex-col w-[220px]">
              {movie.comingSoon && <span className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-semibold">Coming Soon</span>}
              {movie.quantity === 0 && !movie.comingSoon && <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">Sold Out</span>}
              {movie.pgAge && <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${pgBadgeColor(movie.pgAge)}`}>{movie.pgAge}</span>}
              <img src={movie.coverImage || "https://via.placeholder.com/300x450?text=No+Image"} alt={movie.title} className="w-full h-auto rounded-t-xl" />
              <div className="p-4 flex flex-col justify-between h-full">
                <div>
                  <h2 className="text-lg font-semibold">{movie.title}</h2>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{movie.overview}</p>
                  <p className="font-semibold mt-2">{movie.discountPrice ? <>
                    <span className="line-through text-gray-400">${movie.price}</span>{" "}
                    <span className="text-green-600">${movie.discountPrice}</span>
                  </> : `$${movie.price}`}</p>
                  <p className="flex items-center text-sm text-gray-700 mt-1"><Star size={16} className="text-yellow-500 mr-1" />{movie.rating.average.toFixed(1)}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    disabled={isInCart || movie.quantity === 0}
                    onClick={() => addToCart(movie.id)}
                    className={`flex-1 py-1.5 text-sm rounded-lg ${isInCart ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                  >
                    {isInCart ? "Added" : "Add to Cart"}
                  </button>
                  <button onClick={() => router.push(`/movies/${movie._id}`)} className="flex-1 border border-gray-300 py-1.5 text-sm rounded-lg hover:bg-gray-100">Explore</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

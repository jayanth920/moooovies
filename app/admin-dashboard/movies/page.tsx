"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Edit3, Grid, List, BarChart3, Plus } from "lucide-react";
import MovieStatsCharts from "../components/MovieStatsCharts";

export default function AdminMoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [comingSoonOnly, setComingSoonOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showStats, setShowStats] = useState(true);

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

  useEffect(() => {
    fetchMovies();
  }, []);

  // Filters
  useEffect(() => {
    let temp = [...movies];
    if (search.trim())
      temp = temp.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase())
      );
    if (genreFilter) temp = temp.filter((m) => m.genre.includes(genreFilter));
    if (languageFilter)
      temp = temp.filter((m) => m.languages?.includes(languageFilter));
    if (availabilityOnly) temp = temp.filter((m) => m.quantity > 0);
    if (comingSoonOnly) temp = temp.filter((m) => m.comingSoon);
    if (discountOnly) temp = temp.filter((m) => m.discountPrice != null);

    switch (sortBy) {
      case "newest":
        temp.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        temp.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "priceLow":
        temp.sort((a, b) => a.price - b.price);
        break;
      case "priceHigh":
        temp.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        temp.sort((a, b) => b.rating.average - a.rating.average);
        break;
    }

    setFiltered(temp);
  }, [
    search,
    movies,
    genreFilter,
    languageFilter,
    availabilityOnly,
    comingSoonOnly,
    discountOnly,
    sortBy,
  ]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Single toggle function for Select All / Deselect All
  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((m) => m._id));
    }
  };

  const deleteSelected = async () => {
    if (selected.length === 0) return alert("No movies selected");
    if (!confirm(`Delete ${selected.length} selected movies?`)) return;

    try {
      await fetch("/api/movies/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      setMovies((prev) => prev.filter((m) => !selected.includes(m._id)));
      setSelected([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh]">
        Loading movies...
      </div>
    );

  const allGenres = Array.from(new Set(movies.flatMap((m) => m.genre)));
  const allLanguages = Array.from(
    new Set(movies.flatMap((m) => m.languages || []))
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Movies Manager 🎬</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin-dashboard/movies/add')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Add Movie
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <BarChart3 size={18} /> 
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
          <button
            onClick={toggleSelectAll}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {selected.length === filtered.length ? "Deselect All" : "Select All"}
          </button>
          <button
            onClick={deleteSelected}
            disabled={selected.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Trash2 size={18} /> Delete ({selected.length})
          </button>
          <button
            onClick={() =>
              setViewMode((prev) => (prev === "grid" ? "list" : "grid"))
            }
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
          >
            {viewMode === "grid" ? <List size={18} /> : <Grid size={18} />}{" "}
            {viewMode === "grid" ? "List" : "Grid"}
          </button>
        </div>
      </div>

      {/* Statistics Charts */}
      {showStats && <MovieStatsCharts />}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Genres</option>
          {allGenres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Languages</option>
          {allLanguages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={availabilityOnly}
            onChange={() => setAvailabilityOnly(!availabilityOnly)}
            className="rounded focus:ring-blue-500"
          />
          Available Only
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={comingSoonOnly}
            onChange={() => setComingSoonOnly(!comingSoonOnly)}
            className="rounded focus:ring-blue-500"
          />
          Coming Soon
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={() => setDiscountOnly(!discountOnly)}
            className="rounded focus:ring-blue-500"
          />
          Discounted
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sort By</option>
          <option value="newest">Newest Releases</option>
          <option value="oldest">Oldest Releases</option>
          <option value="priceLow">Price: Low → High</option>
          <option value="priceHigh">Price: High → Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Movie list/grid */}
      <div
        className={`${
          viewMode === "grid"
            ? "grid grid-cols-2 md:grid-cols-4 gap-6"
            : "flex flex-col gap-4"
        }`}
      >
        {filtered.map((movie) => (
          <div
            key={movie._id}
            className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow ${
              viewMode === "list" ? "flex items-center p-4" : "flex flex-col"
            } relative group`}
          >
            {/* Checkbox - Positioned differently based on view mode */}
            {viewMode === "list" ? (
              <input
                type="checkbox"
                checked={selected.includes(movie._id)}
                onChange={() => toggleSelect(movie._id)}
                className="mr-4 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            ) : (
              <input
                type="checkbox"
                checked={selected.includes(movie._id)}
                onChange={() => toggleSelect(movie._id)}
                className="absolute top-3 right-3 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            )}

            {/* Image */}
            <div className={viewMode === "list" ? "flex-shrink-0" : ""}>
              <img
                src={
                  movie.coverImage ||
                  "https://via.placeholder.com/200x300?text=No+Image"
                }
                alt={movie.title}
                className={`${
                  viewMode === "list"
                    ? "w-20 h-28 object-cover rounded-lg"
                    : "w-full h-auto rounded-t-xl"
                }`}
              />
            </div>

            {/* Content */}
            <div
              className={`${
                viewMode === "list" 
                  ? "flex-1 flex justify-between items-center ml-4" 
                  : "p-4 flex-1 flex flex-col"
              }`}
            >
              <div className={viewMode === "grid" ? "flex-1" : ""}>
                <h2 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                  {movie.title}
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  {movie.genre.join(", ")}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    ${movie.discountPrice || movie.price}
                  </span>
                  {movie.discountPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ${movie.price}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Stock: {movie.quantity}</span>
                  {movie.comingSoon && (
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  )}
                  {movie.featured && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
              </div>
              
              {/* Edit Button */}
              <button
                onClick={() =>
                  router.push(`/admin-dashboard/movies/${movie._id}`)
                }
                className={`${
                  viewMode === "list"
                    ? "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    : "mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors w-full"
                }`}
              >
                <Edit3 size={16} /> Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold mb-2">No movies found</h3>
          <p className="text-center max-w-md">
            {movies.length === 0 
              ? "Get started by adding your first movie!" 
              : "Try adjusting your filters to see more results."}
          </p>
        </div>
      )}
    </div>
  );
}
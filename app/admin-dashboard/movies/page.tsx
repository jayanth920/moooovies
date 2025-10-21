"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Edit3, Grid, List } from "lucide-react";

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

  const selectAll = () => setSelected(filtered.map((m) => m._id));
  const deselectAll = () => setSelected([]);

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
            onClick={selectAll}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Deselect All
          </button>
          <button
            onClick={deleteSelected}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
          >
            <Trash2 size={16} /> Delete Selected
          </button>
          <button
            onClick={() =>
              setViewMode((prev) => (prev === "grid" ? "list" : "grid"))
            }
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
          >
            {viewMode === "grid" ? <List size={16} /> : <Grid size={16} />}{" "}
            {viewMode === "grid" ? "List" : "Grid"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md"
        />
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
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
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">All Languages</option>
          {allLanguages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={availabilityOnly}
            onChange={() => setAvailabilityOnly(!availabilityOnly)}
          />
          Available Only
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={comingSoonOnly}
            onChange={() => setComingSoonOnly(!comingSoonOnly)}
          />
          Coming Soon
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={() => setDiscountOnly(!discountOnly)}
          />
          Discounted
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
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
            ? "grid grid-cols-2 md:grid-cols-4 gap-4"
            : "flex flex-col gap-2"
        }`}
      >
        {filtered.map((movie) => (
          <div
            key={movie._id}
            className={`bg-white rounded-lg shadow p-4 flex ${
              viewMode === "list" ? "flex-row items-center gap-4" : "flex-col"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(movie._id)}
              onChange={() => toggleSelect(movie._id)}
              className="mr-2"
            />
            <img
              src={
                movie.coverImage ||
                "https://via.placeholder.com/200x300?text=No+Image"
              }
              alt={movie.title}
              className={`rounded ${
                viewMode === "list"
                  ? "w-16 h-20 object-cover"
                  : "w-full h-64 object-cover"
              }`}
            />
            <div
              className={`flex-1 ${
                viewMode === "list" ? "flex justify-between items-center" : ""
              }`}
            >
              <div>
                <h2 className="font-semibold">{movie.title}</h2>
                <p className="text-sm text-gray-600">{movie.genre.join(", ")}</p>
                <p className="text-sm text-gray-500">
                  ${movie.discountPrice || movie.price}
                </p>
              </div>
              <button
                onClick={() =>
                  router.push(`/admin-dashboard/movies/${movie._id}`)
                }
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <Edit3 size={16} /> Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

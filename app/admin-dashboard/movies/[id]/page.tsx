"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MovieEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovie = async () => {
      const res = await fetch(`/api/movies?id=${id}`);
      const data = await res.json();
      setMovie(data.movies?.[0] || null);
      setLoading(false);
    };
    fetchMovie();
  }, [id]);

  const handleChange = (e: any) => {
    setMovie({ ...movie, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movie),
      });
      alert("Movie updated!");
      router.push("/admin-dashboard/movies");
    } catch (err) {
      console.error(err);
      alert("Failed to save movie");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!movie) return <div className="p-8">Movie not found</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Movie</h1>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-semibold">Title</span>
          <input
            name="title"
            value={movie.title}
            onChange={handleChange}
            className="border rounded p-2"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-semibold">Price</span>
          <input
            name="price"
            type="number"
            value={movie.price}
            onChange={handleChange}
            className="border rounded p-2"
          />
        </label>

        <label className="flex flex-col col-span-2">
          <span className="text-sm font-semibold">Overview</span>
          <textarea
            name="overview"
            value={movie.overview}
            onChange={handleChange}
            className="border rounded p-2"
          />
        </label>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
        <button
          onClick={() => router.push("/admin-dashboard/movies")}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

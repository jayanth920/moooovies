"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/components/context/userContext";

export default function ProfilePage() {
  const { user: contextUser, setUser: setContextUser } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<"checking" | "valid" | "taken" | null>(null);

  let debounceTimer: NodeJS.Timeout;

  // Initialize form from context user
  useEffect(() => {
    if (contextUser) {
      setName(contextUser.name);
      setEmail(contextUser.email);
      setLoading(false);
    }
  }, [contextUser]);

  // ---------------- Email Check ----------------
  useEffect(() => {
    if (!contextUser) return;

    if (email === contextUser.email) {
      setEmailStatus(null); // current email is always valid
      return;
    }
    if (!email.trim()) {
      setEmailStatus(null);
      return;
    }

    setEmailStatus("checking");
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/me/check-email?email=${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        setEmailStatus(data.available ? "valid" : "taken");
      } catch {
        setEmailStatus(null);
      }
    }, 500);
  }, [email, contextUser]);

  const handleSave = async () => {
    if (!contextUser) return;
    if (emailStatus === "taken") {
      setMessage("Email is already taken.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name, email, ...(password ? { password } : {}) }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Profile updated successfully!");
        setPassword("");

        // Update context so all components see new info immediately
        setContextUser({ ...contextUser, name, email });
      } else {
        setMessage(data.error || "Failed to update profile.");
      }
    } catch {
      setMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8 text-center">Loading profile...</p>;
  if (!contextUser) return <p className="p-8 text-center text-red-600">User not found.</p>;

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      {message && <p className="mb-4 text-center text-green-600">{message}</p>}

      <div className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="font-semibold">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col">
          <span className="font-semibold">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          {emailStatus === "checking" && <span className="text-sm text-gray-500">Checking...</span>}
          {emailStatus === "taken" && <span className="text-sm text-red-600">Email is already taken.</span>}
          {emailStatus === "valid" && <span className="text-sm text-green-600">Email is available.</span>}
        </label>

        <label className="flex flex-col">
          <span className="font-semibold">New Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="border border-gray-300 rounded px-3 py-2"
          />
        </label>

        <button
          onClick={handleSave}
          disabled={saving || emailStatus === "checking"}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

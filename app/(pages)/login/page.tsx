"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/components/context/userContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { user, token, setToken, loading: authLoading } = useUser();

  // Redirect if already logged in
  useEffect(() => {
    if (user && token && !authLoading) {
      router.push("/");
    }
  }, [user, token, authLoading, router]);

  const handleAuth = async () => {
    setLoading(true);
    setError(""); // Clear previous error

    try {
      const endpoint = isSignup ? "/api/users/register" : "/api/users/login";
      const body = isSignup ? { name, email, password } : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Set error message without throwing an error
        setError(data.error || `${isSignup ? "Signup" : "Login"} failed`);
        return; // Exit early
      }

      if (isSignup) {
        alert("Signup successful! Please login.");
        setIsSignup(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        const { token } = data;
        setToken(token); // store token, context will fetch user automatically
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      // Only set generic error for network issues
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{isSignup ? "Sign Up" : "Login"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSignup && (
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <Button className="w-full" onClick={handleAuth} disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : isSignup ? (
              "Sign Up"
            ) : (
              "Login"
            )}
          </Button>

          <button
            className="text-sm text-blue-500 underline w-full text-center"
            onClick={() => {
              setIsSignup(!isSignup);
              setError(""); // Clear error when switching modes
              setName("");
              setEmail("");
              setPassword("");
            }}
          >
            {isSignup
              ? "Already have an account? Login"
              : "Don't have an account? Sign Up"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
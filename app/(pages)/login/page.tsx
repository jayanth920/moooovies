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

  const router = useRouter();
  const { user, setSyncUser } = useUser();

  // Redirect if already logged in
  useEffect(() => {
    if (user || localStorage.getItem("user")) {
      router.push("/");
    }
  }, [user, router]);

  const handleAuth = async () => {
    console.log("user", {email, password})
    setLoading(true);
    try {
      const endpoint = isSignup ? "/api/users/register" : "/api/users/login";
      const body = isSignup
        ? { name, email, password }
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`${isSignup ? "Signup" : "Login"} failed`);
      }

      if (isSignup) {
        alert("Signup successful! Please login.");
        setIsSignup(false);
      } else {
        const { token, user } = await response.json();
        setSyncUser(user);
        localStorage.setItem("token", token);
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      alert("Authentication failed. Please check your credentials.");
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
            onClick={() => setIsSignup(!isSignup)}
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

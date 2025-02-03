"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ✅ Define interface for API response
interface LoginResponse {
  message?: string;
  token?: string;
  error?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // ✅ Explicitly type the response as LoginResponse
      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        // ✅ Ensure data.error is a string before setting it
        setError(data.error ?? "An unexpected error occurred.");
      } else {
        // Optionally store the token in localStorage or cookies if needed
        // localStorage.setItem("token", data.token ?? "");

        router.push("/patron-dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <button
        onClick={() => signIn("google", { callbackUrl: "/patron-dashboard" })}
        className="px-6 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600"
      >
        Sign in with Google
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}

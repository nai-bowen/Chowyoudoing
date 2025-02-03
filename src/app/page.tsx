import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-8">Welcome to Chow You Doing</h1>
      <div className="flex gap-4">
        <Link href="/login">
          <button className="px-6 py-3 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition">
            Login
          </button>
        </Link>
        <Link href="/register">
          <button className="px-6 py-3 bg-green-500 rounded-lg text-white hover:bg-green-600 transition">
            Sign Up
          </button>
        </Link>
      </div>
    </main>
  );
}

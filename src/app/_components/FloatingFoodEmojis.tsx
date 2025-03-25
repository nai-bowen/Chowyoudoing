"use client";

import { useMemo } from "react";

const foodEmojis = ["🍕", "🍔", "🍣", "🍜", "🍩", "🌮", "🥗", "🍦", "🍗", "🧁", "🍹", "🥪"];

export default function FloatingFoodEmojis() {
  const emojis = useMemo(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) return null;

    return foodEmojis.map((emoji, index) => {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = 5 + Math.random() * 5;

      return (
        <div
          key={index}
          className="absolute select-none pointer-events-none text-2xl"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animation: `float ${duration}s ease-in-out infinite`,
            animationDelay: `${delay}s`,
            opacity: 0.6,
            zIndex: 0,
          }}
        >
          {emoji}
        </div>
      );
    });
  }, []);

  return (
    <>
      {emojis}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Kufam, Pacifico } from "next/font/google";

// Import Google Fonts Correctly
const kufam = Kufam({
  weight: "700",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
});

export default function Home() {
  const { scrollY } = useScroll();

  // Scroll-based animations for emblem
  const rotateEmblem = useTransform(scrollY, [0, 500], [0, 360]); // Full rotation
  const scaleEmblem = useTransform(scrollY, [0, 500], [1, 2]); // Doubles in size
  const fadeOutEmblem = useTransform(scrollY, [300, 500], [1, 0]); // Fades out at the end

  const fadeOutFirstHero = useTransform(scrollY, [300, 500], [1, 0]);
  const fadeInSecondHero = useTransform(scrollY, [300, 500], [0, 1]);

  return (
    <main className="relative min-h-screen overflow-hidden">
{/* Navigation Bar */}
<nav className="fixed top-0 left-0 w-full flex justify-between items-center px-8 py-1 bg-transparent z-50">
  {/* Left: Logo */}
  <div className="flex items-center">
    <Image src="/assets/cyd_fullLogo.png" alt="Chow You Doing Logo" width={100} height={35} />
  </div>

  {/* Center: Navigation Links */}
  <div className="hidden md:flex gap-8 text-[#5A5A5A] text-lg font-medium">
    <a href="/browse" className="hover:text-[#A90D3C] transition">Browse</a>
    <a href="/search" className="relative text-[#A90D3C] font-semibold after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-[#A90D3C]">
      Search
    </a>
    <a href="/why" className="hover:text-[#A90D3C] transition">Why?</a>
  </div>

  {/* Right: Location & Menu Icon */}
  <div className="flex items-center gap-6">
    <div className="flex items-center gap-1 text-lg text-[#5A5A5A] cursor-pointer">
      <span>London</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#5A5A5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    {/* Hamburger Menu for Mobile */}
    <button className="md:hidden">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#5A5A5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    </button>
  </div>
</nav>


      {/* First Background */}
      <motion.div
        className="fixed inset-0 layer1 spacer transition-all duration-1000 ease-in-out"
        style={{ opacity: fadeOutFirstHero }}
      />

      {/* Second Background (Blurred Food) */}
      <motion.div
        className="fixed inset-0 transition-all duration-1000 ease-in-out"
        style={{ opacity: fadeInSecondHero }}
      >
        <Image
          src="/assets/background_3blur.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="transition-opacity duration-1000"
        />
      </motion.div>


      {/* First Section (Before Scroll) */}
      <motion.section
        className="fixed flex items-center justify-between w-full min-h-screen px-16"
        style={{ opacity: fadeOutFirstHero }}
      >
        {/* Left Content: Heading & Search Bar */}
        <div className="flex flex-col w-1/2 items-center text-center">
          <h1
            className={`relative z-10 text-[96px] font-bold text-[#FFB400] drop-shadow-[5px_5px_10px_rgba(0,0,0,0.5)] leading-tight ${kufam.className}`}
          >
            Where{" "}
            <span className="relative inline-block">
              {/* Emblem with Scaling & Rotation Effect */}
              <motion.div
                className="absolute inset-0 -translate-x-1/2 left-1/2 -top-4 z-0"
                style={{
                  rotate: rotateEmblem,
                  scale: scaleEmblem,
                  opacity: fadeOutEmblem,
                  width: "150px",
                  height: "150px",
                }}
              >
                <Image src="/assets/cyd_emblem.png" alt="Rotating Emblem" layout="fill" />
              </motion.div>
              <span className={`${pacifico.className} text-[#A90D3C] relative z-10`}>taste</span>
            </span>{" "}
            speaks,
            <br />
            and meals shine
          </h1>

{/* Search Bar */}
<div className="mt-6 relative w-full max-w-[80%]">
  <input
    type="text"
    placeholder="Search for an interesting meal or restaurant!"
    className="w-full p-4 rounded-full shadow-lg text-gray-800 border border-gray-300"
  />
  <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-6 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 17l5-5m0 0l-5-5m5 5H3"
      />
    </svg>
  </div>
</div>

        </div>

      {/* Right Content: Illustration & Subtitle */}
      <div className="flex flex-col items-center w-1/2 pl-12"> {/* Added left padding for spacing */}
        <Image src="/assets/eat.png" alt="Eat Illustration" width={500} height={500} />
        <p className={`mt-6 text-[24px] text-[#FFB400] opacity-100 text-center ${kufam.className}`}>
          Discover, rate, and recommend <br />
          the best meals around you—one bite at a time.
        </p>
      </div>

      </motion.section>

      {/* Second Section (After Scroll) */}
      <motion.section
        className="fixed flex flex-col items-center justify-center w-full min-h-screen text-center"
        style={{ opacity: fadeInSecondHero }}
      >
        <h1
          className={`text-[128px] font-bold text-white drop-shadow-lg leading-tight ${kufam.className}`}
        >
          Where{" "}
          <span className="relative inline-block">
            {/* Emblem with Scaling & Rotation Effect in the second section */}
            <motion.div
              className="absolute inset-0 -translate-x-1/2 left-1/2 -top-10 z-0"
              style={{
                rotate: rotateEmblem,
                scale: scaleEmblem,
                opacity: fadeOutEmblem,
                width: "150px",
                height: "150px",
              }}
            >
              <Image src="/assets/cyd_emblem.png" alt="Rotating Emblem" layout="fill" />
            </motion.div>
            <span className={`${pacifico.className} text-white relative z-10`}>taste</span>
          </span>{" "}
          speaks,
          <br />
          and meals shine
        </h1>

        <div className="mt-6 relative w-full max-w-2xl">
          <input
            type="text"
            placeholder="Search for an interesting meal or restaurant!"
            className="w-full p-4 rounded-full shadow-lg text-gray-800 border border-gray-300"
          />
          <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 17l5-5m0 0l-5-5m5 5H3"
              />
            </svg>
          </div>
        </div>

        <p className={`mt-6 text-lg text-white ${kufam.className}`}>
          Discover, rate, and recommend the best meals around you—one bite at a time.
        </p>

        <div className="fixed bottom-0 w-full">
          <svg
            viewBox="0 0 1440 320"
            className="w-full"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="#FFDEAD" fillOpacity="1" d="M0,320L1440,160L1440,320L0,320Z"></path>
          </svg>
        </div>
      </motion.section>

      {/* Dummy scroll space to allow scrolling */}
      <div className="h-[200vh]" />
    </main>
  );
}

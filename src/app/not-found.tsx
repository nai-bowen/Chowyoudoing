"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const NotFound = (): JSX.Element => {
  const pathname = usePathname();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname
    );
  }, [pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9] overflow-hidden">
      <div className="text-center px-4">
        {/* Burger animation container */}
        <div className="relative w-[280px] h-[280px] mx-auto mb-6">
          {/* Top bun */}
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 120,
              delay: 0.1,
              duration: 0.6 
            }}
            className="absolute w-[220px] h-[80px] left-[30px] top-[10px] z-30"
          >
            <div className="w-full h-full bg-[#F8C471] rounded-[100px_100px_20px_20px] shadow-md relative overflow-hidden">
              {/* Eyes */}
              <div className="absolute w-[8px] h-[8px] bg-[#333] rounded-full left-[70px] top-[30px]"></div>
              <div className="absolute w-[8px] h-[8px] bg-[#333] rounded-full right-[70px] top-[30px]"></div>
              {/* Sad mouth */}
              <div className="absolute w-[30px] h-[10px] border-b-2 border-[#333] rounded-[50%] left-[95px] top-[50px]"></div>
              {/* Sesame seeds */}
              <div className="absolute w-[5px] h-[7px] bg-[#F9E4B7] rounded-[3px_3px_5px_5px] left-[40px] top-[20px] rotate-[20deg]"></div>
              <div className="absolute w-[5px] h-[7px] bg-[#F9E4B7] rounded-[3px_3px_5px_5px] left-[60px] top-[15px] rotate-[10deg]"></div>
              <div className="absolute w-[5px] h-[7px] bg-[#F9E4B7] rounded-[3px_3px_5px_5px] right-[50px] top-[18px] rotate-[-15deg]"></div>
              <div className="absolute w-[5px] h-[7px] bg-[#F9E4B7] rounded-[3px_3px_5px_5px] right-[80px] top-[22px] rotate-[-5deg]"></div>
            </div>
          </motion.div>

          {/* 404 text */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 150,
              delay: 0.5,
              duration: 0.6 
            }}
            className="absolute left-[70px] top-[100px] z-20 w-[140px]"
          >
            <h1 className="text-[80px] font-bold text-[#393E46] leading-none">404</h1>
          </motion.div>

          {/* Bottom bun */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 120,
              delay: 0.3,
              duration: 0.6 
            }}
            className="absolute w-[220px] h-[50px] left-[30px] bottom-[30px] z-10"
          >
            <div className="w-full h-full bg-[#F5CBA7] rounded-[20px_20px_100px_100px] shadow-md"></div>
          </motion.div>
        </div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#393E46] mb-3">Oh Buns! This page can&apos;t be found :(</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Link href="/">
            <button 
              className="bg-[#f2d36e] hover:bg-[#f2d36e]/80 text-gray-900 font-medium px-6 py-3 rounded-full"
            >
              Back to Homepage
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
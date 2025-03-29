import { ReactNode } from 'react';
import PatronNav from '@/app/_components/Patron-Navbar';
import AnimatedBackground from "@/app/_components/AnimatedBackground";

export default function PatronDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Background Animation */}
      <AnimatedBackground />
      
      {/* Navigation */}
      <PatronNav />
      
      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
import { ReactNode } from 'react';
import PatronNav from '@/app/_components/Patron-Navbar';
import AnimatedBackground from "@/app/_components/AnimatedBackground";
import RestaurateurNav from '../_components/RestaurateurNav';

export default function PatronDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Background Animation */}
      <AnimatedBackground />
      
      {/* Navigation */}
      <RestaurateurNav />
      
      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
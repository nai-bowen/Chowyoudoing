// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userType?: "patron" | "restaurateur";
      firstName?: string;
      lastName?: string;
      interests?: string[];
      restaurantName?: string;  // For restaurateurs
      businessRegNumber?: string;  // For restaurateurs
      vatNumber?: string;  // For restaurateurs
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    userType?: "patron" | "restaurateur";
    firstName?: string;
    lastName?: string;
    interests?: string[];
    restaurantName?: string;  // For restaurateurs
    businessRegNumber?: string;  // For restaurateurs
    vatNumber?: string;  // For restaurateurs
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType?: "patron" | "restaurateur";
    firstName?: string;
    lastName?: string;
    interests?: string[];
    restaurantName?: string;  // For restaurateurs
    businessRegNumber?: string;  // For restaurateurs
    vatNumber?: string;  // For restaurateurs
  }
}
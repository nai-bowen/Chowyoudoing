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
      needsProfileCompletion?: boolean; // Add this line
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    userType?: "patron" | "restaurateur";
    firstName?: string;
    lastName?: string;
    interests?: string[];
    needsProfileCompletion?: boolean; // Add this line
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userType?: "patron" | "restaurateur";
    firstName?: string;
    lastName?: string;
    interests?: string[];
    needsProfileCompletion?: boolean; // Add this line
  }
}
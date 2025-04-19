/* eslint-disable */

import GoogleProvider from "next-auth/providers/google";
import { type DefaultSession, type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { CustomPrismaAdapter } from "./custom-prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { User } from "next-auth";

const prisma = new PrismaClient();

/**
 * Module augmentation for `next-auth` types.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      userType?: "patron" | "restaurateur";
      firstName?: string;
      lastName?: string;
      interests?: string[];
      needsProfileCompletion?: boolean;
    } & DefaultSession["user"];
  }
}

/**
 * NextAuth configuration with Prisma Adapter.
 */
export const authConfig: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: CustomPrismaAdapter,  
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only handle OAuth providers (Google), not credentials
      if (account?.provider === "google" && user.email) {
        try {
          // Check if this email already exists as a patron
          const existingPatron = await prisma.patron.findFirst({
            where: {
              email: {
                equals: user.email,
                mode: "insensitive"
              }
            }
          });

          // If user doesn't exist yet, create a new patron record
          if (!existingPatron) {
            // Extract name parts - handle null or undefined values
            const nameParts = (user.name || "").split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

            // Create a random secure password for Google users
            const randomPassword = await bcrypt.hash(
              Math.random().toString(36).slice(2) + Date.now().toString(36), 
              10
            );

            try {
              // Create the new patron account
              const newPatron = await prisma.patron.create({
                data: {
                  email: user.email,
                  firstName: firstName,
                  lastName: lastName,
                  password: randomPassword,
                  interests: []
                }
              });
              
              console.log(`Created new patron for Google user: ${user.email} with ID: ${newPatron.id}`);
              
              // Mark user as needing profile completion
              user.id = newPatron.id;
              (user as any).firstName = firstName;
              (user as any).lastName = lastName;
              (user as any).userType = "patron";
              (user as any).interests = [];
              (user as any).needsProfileCompletion = true;
            } catch (createError) {
              console.error("Error creating patron:", createError);
              return false; // Prevent sign in if we can't create the user
            }
          } else {
            // If user exists, use their ID
            user.id = existingPatron.id;
            // Update the user object with patron data
            (user as any).firstName = existingPatron.firstName;
            (user as any).lastName = existingPatron.lastName;
            (user as any).userType = "patron";
            (user as any).interests = existingPatron.interests;
            
            // Check if profile needs completion (no interests)
            if (!existingPatron.interests || existingPatron.interests.length === 0) {
              (user as any).needsProfileCompletion = true;
            }
          }
        } catch (error) {
          console.error("Error handling Google sign-in:", error);
          return false; // Prevent sign in on error
        }
      }
      return true; // Allow sign in
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id; // Ensure sub is set to user.id for consistency
        
        // Pass through custom properties (using any to avoid type errors)
        if ((user as any).userType) token.userType = (user as any).userType;
        if ((user as any).firstName) token.firstName = (user as any).firstName;
        if ((user as any).lastName) token.lastName = (user as any).lastName;
        if ((user as any).interests) token.interests = (user as any).interests;
        if ((user as any).needsProfileCompletion) token.needsProfileCompletion = (user as any).needsProfileCompletion;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        
        // Add custom properties to session
        if (token.userType) session.user.userType = token.userType as "patron" | "restaurateur";
        if (token.firstName) session.user.firstName = token.firstName as string;
        if (token.lastName) session.user.lastName = token.lastName as string;
        if (token.interests) session.user.interests = token.interests as string[];
        if (token.needsProfileCompletion) session.user.needsProfileCompletion = true;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
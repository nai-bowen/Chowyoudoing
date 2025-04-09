/*eslint-disable */
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        // Default to patron if userType is not specified
        const userType = credentials.userType || "patron";

        // Check if this is a restaurateur login
        if (userType === "restaurateur") {
          // Try to find the restaurateur directly
          const restaurateur = await prisma.restaurateur.findUnique({
            where: { email: credentials.email },
          });

          if (restaurateur) {
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              restaurateur.password
            );

            if (!isValidPassword) {
              throw new Error("Incorrect password.");
            }

            return {
              id: restaurateur.id,
              email: restaurateur.email,
              name: restaurateur.contactPersonName,
              userType: "restaurateur"
            };
          }

          // If not found directly, check RestaurateurAccount
          const restaurateurAccount = await prisma.restaurateurAccount.findFirst({
            where: { email: credentials.email },
            include: { restaurateur: true }
          });

          if (restaurateurAccount && restaurateurAccount.password) {
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              restaurateurAccount.password
            );

            if (!isValidPassword) {
              throw new Error("Incorrect password.");
            }

            return {
              id: restaurateurAccount.restaurateurId,
              email: restaurateurAccount.email,
              name: restaurateurAccount.restaurateur.contactPersonName,
              userType: "restaurateur"
            };
          }

          throw new Error("No restaurateur found with this email.");
        } 
        
        // Patron login (default)
        const patron = await prisma.patron.findUnique({
          where: { email: credentials.email },
        });

        if (!patron) {
          throw new Error("No user found.");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          patron.password
        );

        if (!isValidPassword) {
          throw new Error("Incorrect password.");
        }

        return {
          id: patron.id,
          email: patron.email,
          name: `${patron.firstName} ${patron.lastName}`,
          firstName: patron.firstName,
          lastName: patron.lastName,
          interests: patron.interests,
          userType: "patron"
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Use Object.assign to avoid TypeScript errors with direct property access
        Object.assign(token, {
          id: user.id,
          email: user.email,
          // Use type assertion to access custom properties
          userType: user.userType || "patron",
          firstName: user.firstName,
          lastName: user.lastName,
          interests: user.interests
        });
      }
      return token;
    },
    async session({ session, token }) {
      // Use Object.assign to avoid TypeScript errors
      if (session.user) {
        Object.assign(session.user, {
          id: token.id,
          userType: token.userType || "patron",
          firstName: token.firstName,
          lastName: token.lastName,
          interests: token.interests
        });
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
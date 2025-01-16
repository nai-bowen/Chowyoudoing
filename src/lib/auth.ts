import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

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
          firstName: patron.firstName,
          lastName: patron.lastName,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: any; token: JWT }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        email: token.email as string,
      };
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

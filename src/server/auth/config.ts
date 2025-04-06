/* eslint-disable */

import GoogleProvider from "next-auth/providers/google";
import { type DefaultSession, type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { CustomPrismaAdapter } from "./custom-prisma-adapter";

/**
 * Module augmentation for `next-auth` types.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
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
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,  
        },
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
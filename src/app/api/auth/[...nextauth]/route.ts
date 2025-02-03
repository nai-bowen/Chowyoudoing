/* eslint-disable */
import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/config"; // ✅ Correct import

const handler = NextAuth(authConfig); // ✅ Use the correct config


export { handler as GET, handler as POST };

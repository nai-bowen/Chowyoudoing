/* eslint-disable */

import NextAuth from "next-auth";
import { cache } from "react";
import { authConfig } from "./config";

const nextAuthInstance = NextAuth(authConfig); 

const auth = cache(() => nextAuthInstance);

export const handlers = nextAuthInstance;
export const signIn = nextAuthInstance;
export const signOut = nextAuthInstance;

export { auth };

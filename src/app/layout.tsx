import '../styles/globals.css'
import '../styles/navbar.css'
import '../styles/dashboard.css'
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import Script from "next/script";

import { TRPCReactProvider } from "@/trpc/react";
import NextAuthProvider from "./_components/SessionProvider";

export const metadata: Metadata = {
  title: "Chow You Doing",
  description: "Developed by Naimah Bowen",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-6673510183027550" />
      </head>
      <body>
        <NextAuthProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
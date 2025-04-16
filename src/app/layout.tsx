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
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6673510153027550"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <NextAuthProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../../src/styles/globals.css";
import "../../src/styles/tailwind.css";
import { AppProviders } from "./AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cadence.ly",
  description: "Search for songs and discover BPM information",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bitcount+Grid+Double+Ink:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/dj-cadence-fav.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../../src/styles/globals.css";
import "../../src/styles/tailwind.css";
import { ThemeModeScript, ThemeProvider } from "flowbite-react";
import { AuthSessionProvider } from "./AuthSessionProvider";
import { PlaylistQueueProvider } from "@/components/playlist/PlaylistQueueContext";
import { customTheme } from "./providers";

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
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
        <link href="https://fonts.googleapis.com/css2?family=Bitcount+Grid+Double+Ink:wght@100..900&display=swap" rel="stylesheet"/>
        <link rel="icon" href="/dj-cadence-fav.ico" sizes="any" />
        <ThemeModeScript/>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <ThemeProvider theme={customTheme}>
          <AuthSessionProvider>
            <PlaylistQueueProvider>{children}</PlaylistQueueProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../src/styles/tailwind.css";
import "../../src/styles/globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";


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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

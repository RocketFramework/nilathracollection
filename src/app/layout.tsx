import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nilathra Collection | Luxury Curated Sri Lankan Travel",
  description: "Experience the pinnacle of luxury travel in Sri Lanka. Tailored VIP experiences, deluxe retreats, and custom-designed journeys for the discerning traveler.",
  keywords: ["luxury travel sri lanka", "VIP travel sri lanka", "private tours sri lanka", "curated travel", "luxury resorts sri lanka"],
  authors: [{ name: "Nilathra Collection" }],
  openGraph: {
    title: "Nilathra Collection | Luxury Curated Sri Lankan Travel",
    description: "Experience the pinnacle of luxury travel in Sri Lanka. Tailored VIP experiences, deluxe retreats, and custom-designed journeys.",
    type: "website",
    locale: "en_US",
    url: "https://nilathracollection.com",
    siteName: "Nilathra Collection",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${outfit.variable} ${playfair.variable} antialiased min-h-screen bg-[#F5F3EF] text-[#2B2B2B] font-sans`}
      >
        {children}
      </body>
    </html>
  );
}

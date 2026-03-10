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
  title: {
    default: "Nilathra Collection | Above and Beyond the Norm | Luxury Travel Sri Lanka",
    template: "%s | Nilathra Collection"
  },
  description: "Nilathra Collection is Sri Lanka's premier luxury travel curator. Experience bespoke journeys, VIP handling, and heritage retreats that go above and beyond the norm.",
  keywords: ["Nilathra Collection", "luxury travel sri lanka", "bespoke journeys", "above and beyond the norm", "VIP travel sri lanka", "private tours sri lanka", "curated travel"],
  authors: [{ name: "Nilathra Collection" }],
  creator: "Nilathra Collection",
  publisher: "Nilathra Collection",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Nilathra Collection | Luxury Unfiltered | Above and Beyond the Norm",
    description: "Experience the pinnacle of luxury travel in Sri Lanka with Nilathra Collection. Tailored VIP experiences and journeys that go above and beyond the norm.",
    type: "website",
    locale: "en_US",
    url: "https://nilathra.com",
    siteName: "Nilathra Collection",
    images: [
      {
        url: "/images/luxury_resort_sunset.png",
        width: 1200,
        height: 630,
        alt: "Nilathra Collection - Luxury Unfiltered",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nilathra Collection | Above and Beyond the Norm",
    description: "Sri Lanka's premier choice for high-end travelers. Curated experiences that go above and beyond the norm.",
    images: ["/images/luxury_resort_sunset.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        <Analytics />
      </body>
    </html>
  );
}

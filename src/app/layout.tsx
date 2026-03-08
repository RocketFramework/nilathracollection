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
    default: "Nilathra Travels | Sri Lanka's Best Travel Agency for Luxury Tours",
    template: "%s | Nilathra Travels"
  },
  description: "Nilathra Travels is the best travel agency in Sri Lanka for discerning travelers. Experience bespoke luxury tours, VIP handling, and curated retreats.",
  keywords: ["best travel agency sri lanka", "luxury travel sri lanka", "VIP travel sri lanka", "private tours sri lanka", "curated travel", "bespoke travel sri lanka"],
  authors: [{ name: "Nilathra Travels" }],
  creator: "Nilathra Travels",
  publisher: "Nilathra Travels",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Nilathra Travels | Best Travel Agency in Sri Lanka",
    description: "Experience the pinnacle of luxury travel in Sri Lanka. Tailored VIP experiences and custom-designed journeys for the international traveler.",
    type: "website",
    locale: "en_US",
    url: "https://nilathra.com",
    siteName: "Nilathra Travels",
    images: [
      {
        url: "/images/luxury_resort_sunset.png",
        width: 1200,
        height: 630,
        alt: "Nilathra Travels Luxury Sri Lanka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nilathra Travels | Sri Lanka's Premier Luxury Travel Agency",
    description: "The only choice for high-end travelers coming to Sri Lanka. Curated experiences and unparalleled service.",
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
      </body>
    </html>
  );
}

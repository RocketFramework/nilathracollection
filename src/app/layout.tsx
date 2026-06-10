import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { Outfit, Playfair_Display } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nilathra.com"),
  title: {
    default: "Best Travel Agency in Sri Lanka | Holidays in Sri Lanka",
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
    url: "https://www.nilathra.com",
    siteName: "Nilathra Collection",
    images: [
      {
        url: "/images/luxury_resort_sunset.avif",
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
    images: ["/images/luxury_resort_sunset.avif"],
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
    <html lang="en" className={`scroll-smooth ${outfit.variable} ${playfair.variable}`}>
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-18063208686"
        />
        <Script
          id="google-tag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'AW-18063208686');
            `,
          }}
        />
        <meta name="ahrefs-site-verification" content="22fc30d51e6331979f27c2c228517f2c5970fd11f1da7bcf396ddc32b41d4e56"></meta>
        {/* Ahrefs Analytics */}
        <Script
          strategy="lazyOnload"
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="wlFIqe/l/FqpI6eKpT5gnQ"
        />
      </head>
      <body className="antialiased min-h-screen bg-[#F5F3EF] text-[#2B2B2B] font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

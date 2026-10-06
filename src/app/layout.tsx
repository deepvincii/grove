import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Serif } from "next/font/google";
import localFont from "next/font/local";
import { brand } from "@/lib/web/brand";
import "./globals.css";

// Google now serves Plex Sans as a variable-width font, which Turbopack's production build
// can't load, so it comes from the @fontsource package instead.
const plexSans = localFont({
  variable: "--font-plex-sans",
  src: [
    { path: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2", weight: "600" },
  ],
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}

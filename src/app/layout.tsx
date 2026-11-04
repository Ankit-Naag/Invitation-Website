import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Playfair_Display } from "next/font/google";
import { eventConfig } from "@/config/event";
import { longDate, timeRangeLabel } from "@/lib/event";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Absolute base URL for Open Graph tags — WhatsApp needs absolute image URLs.
 * Set NEXT_PUBLIC_SITE_URL to the final domain; on Vercel the production URL
 * is picked up automatically.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const { partnerOne, partnerTwo } = eventConfig.couple;
const title = `${partnerOne} & ${partnerTwo} — Engagement Invitation`;
const description = `You're invited to celebrate the engagement of ${partnerOne} & ${partnerTwo} — ${longDate}${
  timeRangeLabel ? `, ${timeRangeLabel}` : ""
}${eventConfig.venue.name ? ` at ${eventConfig.venue.name}, ${eventConfig.venue.locality ?? ""}` : ""}.`.replace(/, \./, ".");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: `${partnerOne} & ${partnerTwo}`,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: `${partnerOne} & ${partnerTwo}`,
    title: `You're invited — ${partnerOne} & ${partnerTwo}'s Engagement`,
    description,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `You're invited — ${partnerOne} & ${partnerTwo}'s Engagement`,
    description,
  },
  robots: { index: false, follow: false }, // a private family invitation
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#F8F3EA",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${cormorant.variable} ${playfair.variable} ${manrope.variable} is-sealed`}
      suppressHydrationWarning
    >
      <body>
        <noscript>
          <style>{`.js-only{display:none!important}html.is-sealed,html.is-sealed body{overflow:auto;height:auto}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}

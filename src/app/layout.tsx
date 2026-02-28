import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/lib/providers";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Thank You Tracker — Wedding Gift Management",
    template: "%s | Thank You Tracker",
  },
  description:
    "Track wedding gifts, manage your guest list, and never forget a thank you note. Free and easy to use.",
  openGraph: {
    title: "Thank You Tracker — Wedding Gift Management",
    description:
      "Track wedding gifts, manage your guest list, and never forget a thank you note.",
    type: "website",
    locale: "en_US",
    siteName: "Thank You Tracker",
  },
  twitter: {
    card: "summary",
    title: "Thank You Tracker — Wedding Gift Management",
    description:
      "Track wedding gifts, manage your guest list, and never forget a thank you note.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSerifDisplay.variable} ${dmSans.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

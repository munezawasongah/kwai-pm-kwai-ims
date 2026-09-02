import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Kwai PM Kwai Travel and Tours Limited — Internal Management System",
  description: "Tours & travel operations, bookings, invoicing and fleet management",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/branding/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/branding/icon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/branding/icon-180.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

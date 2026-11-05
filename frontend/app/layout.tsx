import type { Metadata } from "next";
import { VT323, Silkscreen } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "salmon",
  description: "Trope-based recommendation engine — Cupertino '84",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${vt323.variable} ${silkscreen.variable}`}>
      <body>{children}</body>
    </html>
  );
}

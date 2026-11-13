import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { Providers } from "./ui/Providers";
import "./globals.css";

// Display: Archivo 900 at 85 % width. The width axis needs the variable font,
// so the weight is left to the variable range and CSS picks 900.
const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

// Text: Inter 400 and 600 only.
const inter = Inter({
  variable: "--font-text",
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s · salmon",
    default: "salmon: find stories by their tropes",
  },
  description:
    "Search 85,633 films, TV series, anime, games, books and more by the tropes they use. Trope data from TVTropes, CC BY-NC-SA.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

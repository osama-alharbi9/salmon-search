import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { Providers } from "./ui/Providers";
import "./globals.css";

// Display: Newsreader, a text serif with an optical-size axis, so titles get
// the tighter display cut at large sizes. CSS picks 500 and 600.
const newsreader = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz"],
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
    <html lang="en" className={`${newsreader.variable} ${inter.variable}`}>
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

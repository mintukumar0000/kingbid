import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggleFab } from "@/components/ThemeToggleFab";
import { Footer } from "@/components/Footer";
import { SITE_NAME } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — the leaderboard money can buy`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "A public pay-to-rank leaderboard. List your product or X handle — the only ranking factor is how much you bid. Higher bid, higher rank.",
  openGraph: {
    title: `${SITE_NAME} — the leaderboard money can buy`,
    description: "The only ranking factor is your bid. Claim #1 before someone outbids you.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — the leaderboard money can buy`,
    description: "The only ranking factor is your bid. Claim #1 before someone outbids you.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${fraunces.variable} ${ibmPlexMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        <ThemeProvider>
          {children}
          <Footer />
          <ThemeToggleFab />
        </ThemeProvider>
      </body>
    </html>
  );
}

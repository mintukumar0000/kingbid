import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
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
    default: `${SITE_NAME} — WHO'S KING? 👑`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Bid for digital crowns. Keep the title until someone outbids you. Highest valid bid wins.",
  openGraph: {
    title: `${SITE_NAME} — WHO'S KING? 👑`,
    description: "Bid for the crown. Keep it until someone steals it.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — WHO'S KING? 👑`,
    description: "Bid for digital crowns. Highest bid wins.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${fraunces.variable} ${ibmPlexMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.remove('light');document.documentElement.classList.add('dark')}else{document.documentElement.classList.add('light');document.documentElement.classList.remove('dark')}}catch(e){document.documentElement.classList.add('light');document.documentElement.classList.remove('dark')}`,
          }}
        />
        <ThemeProvider>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

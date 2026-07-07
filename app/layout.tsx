import type { Metadata } from "next";
import { Inter, Barlow_Condensed, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const barlow = Barlow_Condensed({ variable: "--font-barlow", weight: ["700", "800"], subsets: ["latin"], display: "swap" });
const ibm = IBM_Plex_Sans({ variable: "--font-ibm", weight: ["300", "400", "500", "600", "700"], subsets: ["latin"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", weight: ["400", "500", "600", "700"], subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Carlos — Your AI Mechanic",
  description: "Describe your car problem. Carlos gives you a real diagnosis in seconds.",
  metadataBase: new URL("https://mchaniccarlos.com"),
  icons: { icon: [{ url: "/carlos-icon.png", type: "image/png" }], apple: "/carlos-icon.png" },
  openGraph: {
    title: "Carlos — Your AI Mechanic",
    description: "Get a real car diagnosis in seconds. Free.",
    url: "https://mchaniccarlos.com",
    siteName: "Mechanic Carlos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carlos — Your AI Mechanic",
    description: "Get a real car diagnosis in seconds. Free.",
  },
};

// Applied before first paint so a light-theme user never sees a dark flash.
// Kept tiny and inline; dark is the default when nothing is stored.
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem("torque_theme");if(t==="light"||(t==="system"&&matchMedia("(prefers-color-scheme: light)").matches))document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable} ${ibm.variable} ${jetbrains.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}

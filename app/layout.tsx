import type { Metadata } from "next";
import { Inter, Barlow_Condensed, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  weight: ["700", "800"],
  subsets: ["latin"],
  display: "swap",
});

const ibm = IBM_Plex_Sans({
  variable: "--font-ibm",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carlos — Your AI Mechanic",
  description:
    "Describe your car problem. Carlos gives you a real diagnosis — ranked causes, step-by-step checks, and fair cost estimates. Free. No hardware needed.",
  metadataBase: new URL("https://mchaniccarlos.com"),
  icons: {
    icon: [
      { url: "/carlos-icon.png", type: "image/png" },
    ],
    apple: "/carlos-icon.png",
  },
  openGraph: {
    title: "Carlos — Your AI Mechanic",
    description: "Get a real car diagnosis in seconds. Free.",
    url: "https://mchaniccarlos.com",
    siteName: "Mechanic Carlos",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carlos — Your AI Mechanic",
    description: "Get a real car diagnosis in seconds. Free.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlow.variable} ${ibm.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        suppressHydrationWarning
      >
        {process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && (
          <Script
            src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
            defer
            strategy="lazyOnload"
          />
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

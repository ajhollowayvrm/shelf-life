import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import StoreProvider from "@/components/StoreProvider";
import UpdateBanner from "@/components/UpdateBanner";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Shelf Life",
  description: "Track your pantry, never run out of what you need",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shelf Life",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1B2838",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full`}>
      <body className="h-full antialiased">
        <div className="app-container flex flex-col">
          <UpdateBanner />
          <StoreProvider>
            {children}
          </StoreProvider>
        </div>
      </body>
    </html>
  );
}

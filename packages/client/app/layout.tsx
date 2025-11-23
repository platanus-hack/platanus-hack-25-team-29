import type { Metadata } from "next";
import { Titillium_Web, Geist, Geist_Mono } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { ReduxProvider } from "./providers"
import "./globals.css";

const titilliumWeb = Titillium_Web({
  variable: "--font-titillium-web",
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700", "900"],
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lucas",
  description: "Lucas",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${titilliumWeb.variable} ${geist.variable} ${geistMono.variable} antialiased`}>
        <ReduxProvider>
          <main className="w-full min-h-screen">
            {children}
          </main>
          <BottomNav />
        </ReduxProvider>
      </body>
    </html>
  );
}

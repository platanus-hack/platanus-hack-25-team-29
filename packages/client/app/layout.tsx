import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "./providers"
import { BottomNav } from "@/components/bottom-nav";

const titilliumWeb = Titillium_Web({
  variable: "--font-titillium-web",
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700", "900"],
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
      <body className={`${titilliumWeb.variable} antialiased`}>
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

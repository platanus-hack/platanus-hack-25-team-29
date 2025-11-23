import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ReduxProvider } from "./providers"

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
      <body className={`${titilliumWeb.variable} antialiased`} >
        <ReduxProvider>
          <SidebarProvider defaultOpen={true}>
            <main className="flex-1 w-full">
              <SidebarTrigger className="hidden md:flex" />
              {children}
            </main>
          </SidebarProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

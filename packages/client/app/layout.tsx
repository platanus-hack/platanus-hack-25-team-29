import type { Metadata } from "next";
import { Geist, Geist_Mono, Titillium_Web } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, MobileSidebarContent } from "@/components/app-sidebar";
import { cookies } from "next/headers"
import { ReduxProvider } from "./providers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  
  // const cookieStore = await cookies()
  // const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${titilliumWeb.variable} antialiased`} >
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

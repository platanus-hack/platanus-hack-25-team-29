"use client"

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { BarChart3, MessageCircle, Wallet, ArrowLeftRight, Cog } from "lucide-react"
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Link from "next/link"
import { Button } from "./ui/button";
import { MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";


const items = [
  {
    title: "Conectar banco",
    url: "/connect",
    icon: Wallet,
    disabled: false
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageCircle,
    disabled: false
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
    disabled: false
  },
  {
    title: "Movements",
    url: "/movements",
    icon: ArrowLeftRight,
    disabled: false
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Cog,
    disabled: true
  }
]

// Mapeo de rutas a títulos en español para el header móvil
const routeTitles: Record<string, string> = {
  "connect": "Conectar Cuenta",
  "chat": "Chat",
  "dashboard": "Dashboard",
  "movements": "Movimientos",
  "settings": "Configuración",
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader/>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroupLabel className="pl-2">Lucas</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.disabled ? (
                  <SidebarMenuButton className="pl-4">
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild className="pl-4">
                    <Link href={item.url} className="w-full">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}


export function MobileSidebarContent() {
  const pathname = usePathname()
  const currentRoute = pathname?.split("/")[1] || ""
  const currentTitle = routeTitles[currentRoute] || "Lucas"

  return (
    <Sheet >
      <div className="border w-full flex md:hidden absolute gap-3 items-center">
        <SheetTrigger asChild className="z-20">
          <Button variant="ghost" className="text-foreground m-1 h-12 px-0 bg-background">
            <MenuIcon className="size-8 text-foreground" />
          </Button>
        </SheetTrigger>
        <h1 className="text-xl font-semibold font-display">
          {currentTitle}
        </h1>
      </div>
      <SheetContent className="w-[250px] text-foreground gap-0 flex flex-col max-h-full" side="left">
        <SheetHeader className="p-4 mb-4">
          <SheetTitle>Lucas</SheetTitle>
        </SheetHeader>
        {
          items.map((item) => (
            item.disabled ? (
              <div key={item.title} className="flex items-center gap-1 p-2 pl-4 hover:bg-accent rounded-md">
                <item.icon className="size-5 mr-2" />
                {item.title}
              </div>
            ) : (
              <SheetClose asChild key={item.title}>
                <Link href={item.url} className="flex items-center gap-1 p-2 pl-4 hover:bg-accent rounded-md">
                  <item.icon className="size-5 mr-2" />
                  {item.title}
                </Link>
              </SheetClose>
            )
          ))
        }
      </SheetContent>
    </Sheet>
  )
}
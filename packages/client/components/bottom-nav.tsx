"use client"

import { Home, MessageCircle, Wallet, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  {
    url: "/dashboard",
    icon: Home,
    disabled: false
  },
  {
    url: "/chat",
    icon: MessageCircle,
    disabled: false
  },
  {
    url: "/connect",
    icon: Wallet,
    disabled: false
  },
  {
    url: "/settings",
    icon: User,
    disabled: true
  },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (url: string) => {
    if (url === "/dashboard" && pathname === "/") return true
    return pathname?.startsWith(url)
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Subtle gradient fade above nav */}
        <div className="absolute -top-10 left-0 right-0 h-10 bg-gradient-to-t from-white/10 to-transparent dark:from-zinc-950/10 pointer-events-none" />
        
        <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-t border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center justify-evenly h-16 pb-safe">
            {navItems.map((item) => {
              const active = isActive(item.url)
              
              // Define common classes for both Link and div
              const className = cn(
                "relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200",
                item.disabled 
                  ? "opacity-40 cursor-not-allowed" 
                  : "active:scale-90 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              )

              // Define inner content to avoid duplication
              const content = (
                <>
                  {active && (
                    <div className="absolute inset-0 bg-teal-50 dark:bg-teal-900/20 rounded-2xl -z-10" />
                  )}
                  <item.icon 
                    className={cn(
                      "w-6 h-6 transition-all duration-300",
                      active ? "text-teal-600 dark:text-teal-400" : "text-zinc-500 dark:text-zinc-400"
                    )}
                    strokeWidth={active ? 2.5 : 2} 
                  />
                  {active && (
                    <span className="absolute bottom-2 w-1 h-1 bg-teal-600 dark:bg-teal-400 rounded-full" />
                  )}
                </>
              )

              // Render explicitly based on disabled state
              if (item.disabled) {
                return (
                  <div key={item.url} className={className}>
                    {content}
                  </div>
                )
              }

              return (
                <Link key={item.url} href={item.url} className={className}>
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Floating Navigation */}
      <nav className="hidden md:block fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-full shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-2 ring-1 ring-black/5 dark:ring-white/5">
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(item.url)
              
              const className = cn(
                "relative p-3 rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                item.disabled && "opacity-40 cursor-not-allowed",
                active
                  ? "bg-teal-600 dark:bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-110"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:scale-105"
              )

              const content = (
                 <item.icon 
                    className="w-5 h-5" 
                    strokeWidth={active ? 2.5 : 2}
                  />
              )

              if (item.disabled) {
                return (
                  <div key={item.url} className={className}>
                    {content}
                  </div>
                )
              }

              return (
                <Link key={item.url} href={item.url} className={className}>
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="h-16 md:hidden" />
    </>
  )
}

"use client"

import { Home, MessageCircle, Wallet, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  {
    url: "/dashboard",
    icon: Home
  },
  {
    url: "/chat",
    icon: MessageCircle
  },
  {
    url: "/connect",
    icon: Wallet
  },
  {
    url: "/settings",
    icon: User
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-around h-20 px-2">
          {navItems.map((item) => {
            const active = isActive(item.url)
            return (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200",
                  active
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <div className={cn(
                  "relative p-2 rounded-2xl transition-all duration-200",
                  active && "bg-teal-50 dark:bg-teal-900/20"
                )}>
                  <item.icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Floating Navigation */}
      <nav className="hidden md:block fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-full shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 px-3 py-3">
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(item.url)
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    "group relative flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 ease-out",
                    active
                      ? "bg-teal-600 dark:bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      active ? "scale-110" : "group-hover:scale-110"
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Spacer for mobile to prevent content from being hidden behind nav */}
      <div className="h-10 md:hidden" />
    </>
  )
}

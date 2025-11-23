"use client"

import { Account, Movement } from "@/lib/types"
import { useState } from "react"
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel"
import { SpendInTime } from "./charts/spend-in-time"
import { ByCategory } from "./charts/by-category"
import { DailySpend } from "./charts/daily-spend"
import { FixedExpenses } from "./charts/fixed-expenses"
import { UseEmblaCarouselType } from "embla-carousel-react"
import { TrendingDown, TrendingUp } from "lucide-react"

export default function Dashboard({ movements, accounts }: { movements: Movement[], accounts: Account[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const slides = [
    <DailySpend movements={movements} key="daily" />,
    <SpendInTime movements={movements} key="spend" />,
    <ByCategory movements={movements} key="cat" />,
  ]

  const handleSetApi = (api: UseEmblaCarouselType[1]) => {
    if (api) {
      setSelectedIndex(api.selectedScrollSnap())
      api.on("select", () => {
        setSelectedIndex(api.selectedScrollSnap())
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center border sm:p-8 p-2 pb-20">
      <h1 className="text-3xl font-semibold mb-4 hidden md:block w-4xl pl-6">Dashboard</h1>
      
      {/* Desktop Grid */}
      <div className="gap-4 grid-cols-11 hidden md:grid w-4xl mx-auto">
        <div className="col-span-11 flex items-center">

        <div className="w-full px-4">
          <p className="text-base font-semibold text-muted-foreground">Total saldo actual:</p>
          <p className="text-3xl font-bold px-1">$ {accounts.reduce((sum, account) => sum + (account.balance_current || 0), 0).toLocaleString()}</p>
        </div>

        <div className="flex gap-2 w-full my-6">
          <div className="w-1/2 border rounded-lg p-3 bg-sky-50 border-sky-300 text-sky-700">
            <p className="text-base font-semibold">Ingresos <TrendingDown className="inline-block ml-2 size-4" /></p>
            <p className="text-xl font-bold px-1">$ {movements.filter((mov) => mov.amount > 0).reduce((sum, mov) => sum + (mov.amount || 0), 0).toLocaleString()}</p>
          </div>
          <div className="w-1/2 border rounded-lg p-3 bg-sky-50 border-sky-300 text-sky-700">
            <p className="text-base font-semibold">Gastos <TrendingUp className="inline-block ml-2 size-4" /></p>
            <p className="text-xl font-bold px-1">$ {movements.filter((mov) => mov.amount < 0).reduce((sum, mov) => sum + (mov.amount || 0), 0).toLocaleString()}</p>
          </div>
        </div>
        </div>
        <div className="col-span-5">
          <DailySpend movements={movements} />
        </div>
        <div className="col-span-6">
          <SpendInTime movements={movements} />
        </div>
        <div className="col-span-6">
          <ByCategory movements={movements} />
        </div>
        <div className="col-span-5">
          <FixedExpenses movements={movements} />
        </div>
      </div>

      {/* Mobile Carousel */}
      <div className="w-full md:hidden mt-20 flex flex-col items-center">
        <Carousel className="w-full" setApi={handleSetApi}>
          <CarouselContent className="w-full -ml-2">
            {slides.map((slide, i) => (
              <CarouselItem key={i}>
                {slide}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        {/* Dots Indicator */}
        <div className="flex gap-2 my-4">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={`h-2 w-2 rounded-full transition-colors ${
                selectedIndex === idx ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="w-full px-4">
          <p className="text-base font-semibold text-muted-foreground">Total saldo actual:</p>
          <p className="text-3xl font-bold px-1">$ {accounts.reduce((sum, account) => sum + (account.balance_current || 0), 0).toLocaleString()}</p>
        </div>

        <div className="flex gap-2 w-full my-6 px-2">
          <div className="w-1/2 border rounded-lg p-3 bg-sky-50 border-sky-300 text-sky-700">
            <p className="text-base font-semibold">Ingresos <TrendingDown className="inline-block ml-2 size-4" /></p>
            <p className="text-xl font-bold px-1">$ {movements.filter((mov) => mov.amount > 0).reduce((sum, mov) => sum + (mov.amount || 0), 0).toLocaleString()}</p>
          </div>
          <div className="w-1/2 border rounded-lg p-3 bg-sky-50 border-sky-300 text-sky-700">
            <p className="text-base font-semibold">Gastos <TrendingUp className="inline-block ml-2 size-4" /></p>
            <p className="text-xl font-bold px-1">$ {movements.filter((mov) => mov.amount < 0).reduce((sum, mov) => sum + (mov.amount || 0), 0).toLocaleString()}</p>
          </div>
        </div>

        <FixedExpenses movements={movements} />
      </div>
    </div>
  )
}
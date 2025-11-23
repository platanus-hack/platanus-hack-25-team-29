"use client"

import { Account, Movement } from "@/lib/types"
import { useState } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "./ui/carousel"
import { SpendInTime } from "./charts/spend-in-time"
import { ByCategory } from "./charts/by-category"
import { DailySpend } from "./charts/daily-spend"
import { FixedExpenses } from "./charts/fixed-expenses"
import { 
  TrendingDown, 
  TrendingUp, 
  Send, 
  Home, 
  BarChart2, 
  CreditCard, 
  User, 
  ChevronRight,
  Search
} from "lucide-react"

export default function Dashboard({ movements = [], accounts = [] }: { movements: Movement[], accounts: Account[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const totalBalance = (accounts || []).reduce((sum, account) => sum + (account.balance_current || 0), 0)
  const totalIncome = (movements || []).filter((mov) => mov.amount > 0).reduce((sum, mov) => sum + (mov.amount || 0), 0)
  const totalExpenses = (movements || []).filter((mov) => mov.amount < 0).reduce((sum, mov) => sum + (mov.amount || 0), 0)

  const formatCurrency = (amount: number) => {
    const numberString = new Intl.NumberFormat('es-CL', {
      style: 'decimal',
    }).format(amount);
    return <span className="font-display">${numberString}</span>;
  };

  // Mock carousel slides for the chart section inside the card
  const slides = [
    <SpendInTime movements={movements} key="spend" />,
    <DailySpend movements={movements} key="daily" />,
  ]

  const handleSetApi = (api: CarouselApi) => {
    if (api) {
      setSelectedIndex(api.selectedScrollSnap())
      api.on("select", () => {
        setSelectedIndex(api.selectedScrollSnap())
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* =====================================================================================
          DESKTOP VIEW (Kept functional, styled to match theme)
         ===================================================================================== */}
      <div className="hidden md:grid grid-cols-11 gap-6 w-full max-w-7xl mx-auto p-8">
        <div className="col-span-11 mb-4">
           <h1 className="text-3xl font-bold text-teal-800">Tablero</h1>
        </div>

        <div className="col-span-11 grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-500 font-display">Total saldo actual</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
            <p className="text-sm font-medium text-teal-700 flex items-center font-display">Ingresos <TrendingDown className="ml-2 size-4" /></p>
            <p className="text-2xl font-bold text-teal-900 mt-1">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
            <p className="text-sm font-medium text-rose-700 flex items-center font-display">Gastos <TrendingUp className="ml-2 size-4" /></p>
            <p className="text-2xl font-bold text-rose-900 mt-1">{formatCurrency(Math.abs(totalExpenses))}</p>
          </div>
        </div>

        <div className="col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <DailySpend movements={movements} />
        </div>
        <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <SpendInTime movements={movements} />
        </div>
        <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <ByCategory movements={movements} />
        </div>
        <div className="col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <FixedExpenses movements={movements} />
        </div>
      </div>

      {/* =====================================================================================
          MOBILE VIEW ("Concept 1" Implementation)
         ===================================================================================== */}
      <div className="md:hidden flex flex-col w-full pb-24">
        
        {/* 1. AI Header Section */}
        <div className="bg-[#4FB2A3] px-6 pt-12 pb-10 rounded-b-[2.5rem] shadow-lg">
          <h1 className="text-3xl font-medium text-white leading-tight mb-6">
            ¿Qué te gustaría <br/> saber sobre tus finanzas <br/> hoy?
          </h1>
          
          {/* Search Input */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="ej., '¿Cuánto ahorré el mes pasado?'"
              className="w-full pl-5 pr-12 py-4 rounded-full bg-white/95 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none shadow-md"
            />
            <button className="absolute right-1.5 top-1 bg-[#3B8D83] hover:bg-[#2f726a] text-white p-3 rounded-full transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* 2. Conversational Context */}
        <div className="px-6 -mt-4 space-y-6">
          {/* AI Response Bubble */}
          <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-gray-600 text-sm leading-relaxed">
              Aquí está la tendencia de tus ahorros de los últimos 30 días:
            </p>
          </div>

          {/* Chart Card (Styled like the Green Widget) */}
          <div className="w-full bg-gradient-to-br from-[#4FB2A3] to-[#3B8D83] rounded-3xl p-5 text-white shadow-xl overflow-hidden relative">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-teal-100 text-sm font-medium font-display">Ahorros Totales</h3>
                <p className="text-3xl font-semibold mt-1">{formatCurrency(5200.00)}</p>
              </div>
              <div className="flex gap-2">
                 <span className="text-[10px] bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">Gráfico</span>
                 <span className="text-[10px] bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">Tabla</span>
              </div>
            </div>
            
            {/* Chart Area - Using your existing component adapted slightly */}
            <div className="h-40 w-full mt-4 -ml-2">
               {/* Note: Ensure SpendInTime can accept className or style to handle transparent background if needed. 
                   For now, putting it in a container. */}
               <div className="mix-blend-screen opacity-90">
                  <Carousel setApi={handleSetApi}>
                    <CarouselContent>
                        {slides.map((slide, i) => (
                          <CarouselItem key={i}>{slide}</CarouselItem>
                        ))}
                    </CarouselContent>
                  </Carousel>
               </div>
            </div>
            
            {/* Pagination Dots for Card */}
            <div className="flex justify-center gap-1 mt-2">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    selectedIndex === idx ? "w-4 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 3. Total Balance Section */}
          <div className="pt-4">
            <p className="text-gray-500 text-sm font-medium font-display">Saldo total</p>
            <h2 className="text-4xl font-bold text-gray-900 mt-1">
              {formatCurrency(totalBalance)}
            </h2>
          </div>

          {/* 4. Transactions List (Visual Match) */}
          <div className="pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Historial de transacciones</h3>
              <ChevronRight className="text-gray-400 size-5" />
            </div>
            
            <div className="space-y-4">
              {/* Rendering first 4 movements as a list */}
              {movements.slice(0, 4).map((mov, idx) => (
                <div key={idx} className="flex items-center justify-between p-1">
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-full flex items-center justify-center ${mov.amount > 0 ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600'}`}>
                       {/* Simple logic for icon based on amount */}
                       {mov.amount > 0 ? <TrendingDown size={18} /> : <CreditCard size={18} />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{mov.description || "Transacción"}</p>
                      <p className="text-xs text-gray-500">Hoy, 12:40 PM</p>
                    </div>
                  </div>
                  <span className={`font-bold ${mov.amount > 0 ? 'text-teal-600' : 'text-rose-500'}`}>
                    {mov.amount > 0 ? "+" : ""} {formatCurrency(Math.abs(mov.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 px-8 flex justify-between items-center z-50 pb-6 safe-area-pb">
          <button className="flex flex-col items-center gap-1 text-teal-600">
            <div className="bg-teal-50 p-2 rounded-xl">
              <Home size={20} fill="currentColor" className="opacity-20" strokeWidth={2.5} />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
            <BarChart2 size={24} />
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
            <CreditCard size={24} />
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
            <User size={24} />
          </button>
        </div>

      </div>
    </div>
  )
}

"use client"

import { Account, Movement } from "@/lib/types"
import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch } from "@/store/hooks"
import { setInput } from "@/store"
import { motion, AnimatePresence } from "framer-motion"
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "./ui/carousel"
import { SpendInTime } from "./charts/spend-in-time"
import { ByCategory } from "./charts/by-category"
import { DailySpend } from "./charts/daily-spend"
import { FixedExpenses } from "./charts/fixed-expenses"
import { TrendingDown, TrendingUp, Send, Home, BarChart2, CreditCard, User, ChevronRight, Loader2 } from "lucide-react"

export default function Dashboard({ movements = [], accounts = [] }: { movements: Movement[], accounts: Account[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [query, setQuery] = useState('')
  const [isSending, setIsSending] = useState(false)

  const router = useRouter()
  const dispatch = useAppDispatch()

  // Memoize expensive calculations to avoid recomputing on every render
  const totalBalance = useMemo(() =>
    (accounts || []).reduce((sum, account) => sum + (account.balance_current || 0), 0),
    [accounts]
  )

  const totalIncome = useMemo(() =>
    (movements || []).filter((mov) => mov.amount > 0).reduce((sum, mov) => sum + (mov.amount || 0), 0),
    [movements]
  )

  const totalExpenses = useMemo(() =>
    (movements || []).filter((mov) => mov.amount < 0).reduce((sum, mov) => sum + (mov.amount || 0), 0),
    [movements]
  )

  // Calculate average monthly expense
  const avgMonthlyExpense = useMemo(() => {
    if (!movements || movements.length === 0) return 0

    const monthlyTotals: Record<string, number> = {}

    movements
      .filter(m => m.amount < 0) // Only expenses
      .forEach(m => {
        if (!m.post_date) return
        const monthKey = m.post_date.substring(0, 7) // "YYYY-MM"
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Math.abs(m.amount)
      })

    const monthCount = Object.keys(monthlyTotals).length
    if (monthCount === 0) return 0

    const total = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0)
    return total / monthCount
  }, [movements])

  // Calculate current month spending
  const currentMonthSpending = useMemo(() => {
    if (!movements || movements.length === 0) return 0

    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    return movements
      .filter(m => m.amount < 0 && m.post_date && m.post_date.startsWith(currentMonthKey))
      .reduce((sum, m) => sum + Math.abs(m.amount), 0)
  }, [movements])

  // Memoize currency formatter to avoid recreating on every render
  const currencyFormatter = useMemo(() =>
    new Intl.NumberFormat('es-CL', { style: 'decimal' }),
    []
  )

  const formatCurrency = useCallback((amount: number) => {
    const numberString = currencyFormatter.format(amount);
    return <span className="font-display">${numberString}</span>;
  }, [currencyFormatter]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!query.trim()) return;

    // Show typing indicator
    setIsSending(true);

    // Set input in Redux store for chat to pick up
    dispatch(setInput(query.trim()));

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to chat
    router.push('/chat');
  }, [query, dispatch, router]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Memoize slides to prevent unnecessary re-renders of chart components
  const slides = useMemo(() => [
    <SpendInTime movements={movements} transparent key="spend" />,
    <DailySpend movements={movements} transparent key="daily" />,
    <ByCategory movements={movements} transparent key="by-category" />,
  ], [movements])

  const handleSetApi = useCallback((api: CarouselApi) => {
    if (api) {
      setSelectedIndex(api.selectedScrollSnap())
      api.on("select", () => {
        setSelectedIndex(api.selectedScrollSnap())
      })
    }
  }, [])

  // Dynamic card data based on selected carousel slide
  const dynamicCardData = useMemo(() => {
    switch (selectedIndex) {
      case 0: // SpendInTime chart
        return {
          title: "Promedio Mensual",
          value: avgMonthlyExpense
        }
      case 1: // DailySpend chart
        return {
          title: "Gasto del Mes",
          value: currentMonthSpending
        }
      case 2: // ByCategory chart
        return {
          title: "Total de Gastos",
          value: Math.abs(totalExpenses)
        }
      default:
        return {
          title: "Promedio Mensual",
          value: avgMonthlyExpense
        }
    }
  }, [selectedIndex, avgMonthlyExpense, currentMonthSpending, totalExpenses])

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
          <motion.div
            className="relative w-full"
            animate={isSending ? { scale: 0.98, opacity: 0.7 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              placeholder="ej., '¿Cuánto ahorré el mes pasado?'"
              className="w-full pl-5 pr-12 py-4 rounded-full bg-white/95 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none shadow-md disabled:opacity-70 transition-opacity"
            />
            <button
              onClick={handleSubmit}
              disabled={isSending || !query.trim()}
              className="absolute right-1.5 top-1 bg-[#3B8D83] hover:bg-[#2f726a] text-white p-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </motion.div>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 text-white text-sm flex items-center gap-2"
              >
                <Loader2 size={16} className="animate-spin" />
                <span>Enviando...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Conversational Context */}
        <div className="px-6 -mt-4 space-y-6">
          {/* AI Response Bubble */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-gray-600 text-sm leading-relaxed">
              Aquí está la tendencia de tus ahorros de los últimos 30 días:
            </p>
          </div>

          {/* Chart Card (Styled like the Green Widget) */}
          <div className="w-full bg-gradient-to-br from-[#4FB2A3] to-[#3B8D83] rounded-3xl p-5 pb-4 text-white shadow-xl overflow-hidden relative">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-teal-100 text-sm font-medium font-display">{dynamicCardData.title}</h3>
                <p className="text-3xl font-semibold mt-1">{formatCurrency(dynamicCardData.value)}</p>
              </div>
              <div className="flex gap-2">
                 <span className="text-[10px] bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">Gráfico</span>
              </div>
            </div>
            
            {/* Chart Area */}
            <div className="h-64 w-full -mt-4">
              <Carousel setApi={handleSetApi}>
                <CarouselContent>
                  {slides.map((slide, i) => (
                    <CarouselItem key={i}>{slide}</CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
            
            {/* Pagination Dots for Card */}
            <div className="flex justify-center gap-1 mt-12">
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
            <h2 className="text-4xl font-medium text-gray-900 mt-1">
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

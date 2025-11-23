"use client"

import { useEffect, useState } from "react"
import { SpendInTime } from "@/components/charts/spend-in-time"
import { DailySpend } from "@/components/charts/daily-spend"
import { ByCategory } from "@/components/charts/by-category"
import { FixedExpenses } from "@/components/charts/fixed-expenses"
import { format } from "date-fns"
import { Movement } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date()
        const oneYearAgo = format(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()), "yyyy-MM-dd")
        const todayFormatted = format(new Date(), "yyyy-MM-dd")
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://platanus-grupo29-681510028004.us-central1.run.app'
        
        const res = await fetch(API_BASE_URL + "/movements?start_date=" + oneYearAgo + "&end_date=" + todayFormatted, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        const data = await res.json()
        setMovements(data.movements || [])
      } catch (error) {
        console.error("Failed to fetch movements:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>
          <div className="grid gap-4 grid-cols-2">
             <Skeleton className="h-[300px] w-full rounded-xl" />
             <Skeleton className="h-[300px] w-full rounded-xl" />
             <Skeleton className="h-[300px] w-full rounded-xl" />
             <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>
        <div className="grid gap-4 grid-cols-2">
          <SpendInTime movements={movements} />
          <DailySpend movements={movements} />
          <ByCategory movements={movements} />
          <FixedExpenses movements={movements} />
        </div>
      </div>
    </div>
  )
}

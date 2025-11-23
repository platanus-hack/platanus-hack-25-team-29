import { SpendInTime } from "@/components/charts/spend-in-time"
import { DailySpend } from "@/components/charts/daily-spend"
import { ByCategory } from "@/components/charts/by-category"
import { FixedExpenses } from "@/components/charts/fixed-expenses"
import { format } from "date-fns"
import { Movement } from "@/lib/types"


export default async function DashboardPage() {
  const today = new Date()
  const oneYearAgo = format(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()), "yyyy-MM-dd")
  const todayFormatted = format(new Date(), "yyyy-MM-dd")
  const API_BASE_URL = 'https://platanus-grupo29-681510028004.us-central1.run.app'
  const movements = await fetch(API_BASE_URL + "/movements?start_date=" + oneYearAgo + "&end_date=" + todayFormatted, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
  const { movements } = await response.json();
  
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>
        <div className="grid gap-4 grid-cols-2">
          <SpendInTime movements={movements.movements as Movement[]} />
          <DailySpend movements={movements.movements as Movement[]} />
          <ByCategory movements={movements.movements as Movement[]} />
          <FixedExpenses movements={movements.movements as Movement[]} />
        </div>
      </div>
    </div>
  )
}


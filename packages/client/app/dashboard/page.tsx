import { SpendInTime } from "@/components/charts/spend-in-time"
import { DailySpend } from "@/components/charts/daily-spend"
import { ByCategory } from "@/components/charts/by-category"
import { FixedExpenses } from "@/components/charts/fixed-expenses"
import { format } from "date-fns"
import { Movement } from "@/lib/types"


export default async function DashboardPage() {
  const today = new Date()
  const oneYearAgo = format(new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()), "yyyy-MM-dd")
  const todayFormatted = format(new Date(), "yyyy-MM-dd")
  const movements = await fetch(process.env.NEXT_PUBLIC_API_URL + "/movements?start_date=" + oneYearAgo + "&end_date=" + todayFormatted, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(res => res.json());

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


import { SpendInTime } from "@/components/charts/spend-in-time"
import { DailySpend } from "@/components/charts/daily-spend"
import { ByCategory } from "@/components/charts/by-category"
import { FixedExpenses } from "@/components/charts/fixed-expenses"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>
        <div className="grid gap-4 grid-cols-2">
          <SpendInTime />
          <DailySpend />
          <ByCategory />
          <FixedExpenses />
        </div>
      </div>
    </div>
  )
}


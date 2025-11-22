"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { month: "1/12", daily: 10, accumulated: 11 },
  { month: "2/12", daily: 20, accumulated: 19 },
  { month: "3/12", daily: 30, accumulated: 29 },
  { month: "4/12", daily: 40, accumulated: 48 },
  { month: "5/12", daily: 50, accumulated: 55 },
  { month: "6/12", daily: 60, accumulated: 65 },
]

const chartConfig = {
  daily: {
    label: "Daily",
    color: "var(--chart-1)",
  },
  accumulated: {
    label: "Accumulated",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function DailySpend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily spend and accumulated spend</CardTitle>
        <CardDescription>Daily spend and accumulated spend</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="daily"
              type="monotone"
              stroke="var(--color-daily)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="accumulated"
              type="monotone"
              stroke="var(--color-accumulated)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

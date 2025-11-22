"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Movement } from "@/lib/types"
import { groupTransfersByDescription } from "@/lib/groupByDescription"


export function ByCategory({ movements }: { movements: Movement[] }) {
  let groupedTransfers = groupTransfersByDescription(movements)
  groupedTransfers = groupedTransfers
    .filter(group => group.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 7)
  const chartData = groupedTransfers.map(group => ({
    category: group.description,
    amount: group.totalAmount,
    fill: "var(--chart-1)",
  }))
  const chartConfig = {
    amount: {
      label: "Gasto",
    },
    ...groupedTransfers.reduce((acc, group) => {
      acc[group.description] = {
        label: group.description,
        color: "var(--chart-1)",
      }
      return acc
    }, {} as Record<string, { label: string; color: string }>),
  } satisfies ChartConfig
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por Categoría</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={120}
              tick={({ x, y, payload }) => {
                const category = payload.value as string
                const maxLen = 14
                const displayText =
                  category.length > maxLen
                    ? category.slice(0, maxLen - 1) + "…"
                    : category
                return (
                  <text
                    x={x}
                    y={y}
                    width={100}
                    fontSize={12}
                    fill="var(--gray-900, #18181b)"
                    textAnchor="end"
                    alignmentBaseline="middle"
                  >
                    {displayText}
                  </text>
                )
              }}
            />
            <XAxis dataKey="amount" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => `: $${value.toLocaleString()}`}
                  className="space-x-2"
                  labelClassName="space-x-2"
                />
              }
            />
            <Bar dataKey="amount" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

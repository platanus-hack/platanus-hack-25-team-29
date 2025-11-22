"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { category: "Alimentacion", amount: 275000, fill: "var(--color-Alimentacion)" },
  { category: "Transporte", amount: 200000, fill: "var(--color-Transporte)" },
  { category: "Salud", amount: 187000, fill: "var(--color-Salud)" },
  { category: "Carrete", amount: 173000, fill: "var(--color-Carrete)" },
  { category: "Otros", amount: 90000, fill: "var(--color-Otros)" },
]

const chartConfig = {
  amount: {
    label: "Gasto",
  },
  Alimentacion: {
    label: "Alimentación",
    color: "var(--chart-1)",
  },
  Transporte: {
    label: "Transporte",
    color: "var(--chart-2)",
  },
  Salud: {
    label: "Salud",
    color: "var(--chart-3)",
  },
  Carrete: {
    label: "Carrete",
    color: "var(--chart-4)",
  },
  Otros: {
    label: "Otros",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function ByCategory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>By Category</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
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
              width={90}
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

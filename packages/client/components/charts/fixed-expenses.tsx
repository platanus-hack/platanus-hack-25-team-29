"use client"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "../ui/table"

const fixedExpenses = [
  { name: "Netflix", amount: 10000 },
  { name: "Claro", amount: 20000 },
  { name: "Spotify", amount: 30000 },
  { name: "Amazon Prime", amount: 40000 },
  { name: "Disney+", amount: 50000 },
]

export function FixedExpenses() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fixed Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fixedExpenses.map((expense) => (
              <TableRow key={expense.name}>
                <TableCell>{expense.name}</TableCell>
                <TableCell>${expense.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-bold">Total</TableCell>
              <TableCell className="font-bold">${fixedExpenses.reduce((acc, expense) => acc + expense.amount, 0).toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
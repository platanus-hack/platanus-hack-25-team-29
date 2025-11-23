import { format } from "date-fns"
import { Account, Movement } from "@/lib/types"
import Dashboard from "@/components/Dashboard"

// Force dynamic rendering - fetch fresh data on every request
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const today = new Date()
  const oneYearAgo = format(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()), "yyyy-MM-dd")
  const todayFormatted = format(new Date(), "yyyy-MM-dd")
  const API_BASE_URL = 'https://platanus-grupo29-681510028004.us-central1.run.app'
  const response = await fetch(API_BASE_URL + "/movements?start_date=" + oneYearAgo + "&end_date=" + todayFormatted, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
  const accounts = await fetch(`${API_BASE_URL}/fintoc/accounts`);
  const { movements } = await response.json();
  const accountsData = await accounts.json();
  
  return (
    // <Dashboard movements={[] as Movement[]} />
    <Dashboard movements={movements as Movement[]} accounts={accountsData.accounts as Account[]} />
  )
}


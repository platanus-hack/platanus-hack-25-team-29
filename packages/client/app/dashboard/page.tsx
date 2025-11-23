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

  let movements: Movement[] = []
  let accounts: Account[] = []

  try {
    const response = await fetch(API_BASE_URL + "/movements?start_date=" + oneYearAgo + "&end_date=" + todayFormatted, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    if (response.ok) {
      const data = await response.json();
      movements = data.movements || []
    }
  } catch (error) {
    console.error('Error fetching movements:', error)
  }

  try {
    const accountsResponse = await fetch(`${API_BASE_URL}/fintoc/accounts`);
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      accounts = accountsData.accounts || accountsData || []
    }
  } catch (error) {
    console.error('Error fetching accounts:', error)
  }

  return (
    <Dashboard movements={movements} accounts={accounts} />
  )
}


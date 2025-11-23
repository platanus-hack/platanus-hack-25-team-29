import { format } from "date-fns"
import { Account, Movement } from "@/lib/types"
import Dashboard from "@/components/Dashboard"

// Smart caching: revalidate every 60 seconds for fresh data
export const revalidate = 60

export default async function DashboardPage() {
  const today = new Date()
  const oneYearAgo = format(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()), "yyyy-MM-dd")
  const todayFormatted = format(new Date(), "yyyy-MM-dd")
  const API_BASE_URL = 'https://platanus-grupo29-681510028004.us-central1.run.app'

  let movements: Movement[] = []
  let accounts: Account[] = []

  // Fetch both API endpoints in parallel for better performance
  try {
    const [movementsResponse, accountsResponse] = await Promise.all([
      fetch(API_BASE_URL + "/movements?start_date=" + oneYearAgo + "&end_date=" + todayFormatted, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }),
      fetch(`${API_BASE_URL}/fintoc/accounts`, {
        next: { revalidate: 60 }, // Cache for 60 seconds
      })
    ])

    if (movementsResponse.ok) {
      const data = await movementsResponse.json()
      movements = data.movements || []
    } else {
      console.error('Failed to fetch movements:', movementsResponse.status, movementsResponse.statusText)
    }

    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json()
      accounts = accountsData.accounts || accountsData || []
    } else {
      console.error('Failed to fetch accounts:', accountsResponse.status, accountsResponse.statusText)
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }

  return (
    <Dashboard movements={movements} accounts={accounts} />
  )
}


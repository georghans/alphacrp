import { listSearches } from "@/db/searches"
import { mapDbSearch } from "@/lib/searches"
import DashboardClient from "./dashboard-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardPage() {
  const searches = await listSearches()
  const mapped = searches.map(mapDbSearch)
  return <DashboardClient searches={mapped} />
}

import { listSearches } from "@/db/searches"
import { mapDbSearch } from "@/lib/searches"
import SearchesClient from "./searches-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SearchesPage({
  searchParams,
}: {
  searchParams?: { filter?: string }
}) {
  const searches = await listSearches()
  const mapped = searches.map(mapDbSearch)
  const filter = searchParams?.filter
  const initialFilter = filter === "active" || filter === "inactive" ? filter : "all"

  return <SearchesClient searches={mapped} initialFilter={initialFilter} />
}

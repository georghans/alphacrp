import { listMatchingOffers } from "@/db/offers"
import { listSearches } from "@/db/searches"
import { mapDbSearch } from "@/lib/searches"
import MatchesClient from "./matches-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

function parseFilter(filter?: string) {
  if (!filter) return [] as string[]
  return filter
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams?: { filter?: string }
}) {
  const searches = await listSearches()
  const mappedSearches = searches.map(mapDbSearch)
  const activeSearches = mappedSearches.filter((search) => search.isActive)

  const rawFilter = parseFilter(searchParams?.filter)
  const allowedIds = new Set(mappedSearches.map((search) => search.id))
  const filteredIds = rawFilter.filter((id) => allowedIds.has(id))

  const matches = await listMatchingOffers(filteredIds.length ? filteredIds : undefined)

  return (
    <MatchesClient
      matches={matches}
      searches={activeSearches}
    />
  )
}

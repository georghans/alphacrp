"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Filter, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Search } from "@/lib/types"

interface MatchCard {
  id: string
  title: string
  url: string | null
  imageUrl: string | null
  searchId: string
  searchTitle: string | null
  evaluatedAt: Date | string | null
}

interface MatchesClientProps {
  matches: MatchCard[]
  searches: Search[]
}

const formatDate = (value: Date | string | null) => {
  if (!value) return "N/A"
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString()
}

export default function MatchesClient({ matches, searches }: MatchesClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get("filter") ?? ""
  const activeFilters = new Set(
    filterParam
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  )

  const toggleFilter = (id: string) => {
    const nextFilters = new Set(activeFilters)
    if (nextFilters.has(id)) {
      nextFilters.delete(id)
    } else {
      nextFilters.add(id)
    }

    const params = new URLSearchParams(searchParams.toString())
    if (nextFilters.size) {
      params.set("filter", Array.from(nextFilters).join(","))
    } else {
      params.delete("filter")
    }

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const activeSearchCount = activeFilters.size
  const visibleLabel = activeSearchCount
    ? `FILTERED (${activeSearchCount})`
    : "ALL MATCHES"

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            MATCHED OFFERS
          </p>
          <h1 className="font-mono text-3xl font-bold uppercase tracking-wider text-foreground sm:text-4xl">
            MATCHES
          </h1>
        </div>
        <div className="flex items-center gap-2 border-2 border-foreground bg-card px-4 py-3">
          <Filter className="h-4 w-4 text-foreground" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {visibleLabel}
          </span>
        </div>
      </div>

      {/* Active Searches Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            ACTIVE SEARCHES
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {searches.length} TOTAL
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {searches.length > 0 ? (
            searches.map((search) => {
              const isSelected = activeFilters.has(search.id)
              return (
                <Button
                  key={search.id}
                  type="button"
                  variant="outline"
                  onClick={() => toggleFilter(search.id)}
                  className={cn(
                    "border-2 font-mono text-[10px] uppercase tracking-wider",
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground bg-transparent text-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {isSelected && <CheckCircle2 className="mr-2 h-3 w-3" />}
                  {search.title}
                </Button>
              )
            })
          ) : (
            <div className="border-2 border-dashed border-foreground p-6 text-center">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                NO ACTIVE SEARCHES
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        SHOWING {matches.length} MATCH{matches.length !== 1 ? "ES" : ""}
      </p>

      {/* Matches Grid */}
      {matches.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="group border-2 border-foreground bg-card transition-all duration-150 hover:translate-x-1 hover:-translate-y-1 hover:border-accent hover:shadow-[4px_4px_0_0_var(--accent)]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden border-b-2 border-foreground bg-muted">
                {match.imageUrl ? (
                  <Image
                    src={match.imageUrl}
                    alt={match.title}
                    fill
                    className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted">
                    <span className="font-mono text-6xl font-bold text-muted-foreground/30">
                      {match.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute left-0 top-0 border-b-2 border-r-2 border-foreground bg-background px-3 py-1">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
                    MATCH
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div className="space-y-1">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-foreground line-clamp-2">
                    {match.title}
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {match.searchTitle ?? "UNKNOWN SEARCH"}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t-2 border-border pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {formatDate(match.evaluatedAt)}
                  </span>
                  {match.url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2 border-2 border-foreground bg-transparent font-mono text-[10px] uppercase tracking-wider hover:border-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      <Link href={match.url} target="_blank" rel="noreferrer">
                        <Link2 className="h-3 w-3" />
                        OPEN
                      </Link>
                    </Button>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      NO LINK
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-foreground p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-foreground">
            <CheckCircle2 className="h-8 w-8 text-foreground" />
          </div>
          <h3 className="mt-6 font-mono text-sm font-bold uppercase tracking-wider text-foreground">
            NO MATCHES FOUND
          </h3>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {activeFilters.size
              ? "TRY REMOVING SOME FILTERS"
              : "RUN THE MATCHER TO POPULATE RESULTS"}
          </p>
        </div>
      )}
    </div>
  )
}

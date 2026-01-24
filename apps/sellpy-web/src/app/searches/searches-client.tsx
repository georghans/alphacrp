"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Search, LayoutGrid, List, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchCard } from "@/components/search-card"
import { cn } from "@/lib/utils"
import type { Search as SearchType } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SearchesClientProps {
  searches: SearchType[]
  initialFilter?: "all" | "active" | "inactive"
}

export default function SearchesClient({ searches, initialFilter = "all" }: SearchesClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">(initialFilter)

  const handleNewSearch = () => {
    const newId = crypto.randomUUID()
    router.push(`/searches/${newId}`)
  }

  const filteredSearches = searches.filter((search) => {
    const matchesQuery =
      search.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      search.prompt.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && search.isActive) ||
      (filterStatus === "inactive" && !search.isActive)

    return matchesQuery && matchesFilter
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">SEARCH MANAGEMENT</p>
          <h1 className="font-mono text-3xl font-bold uppercase tracking-wider text-foreground sm:text-4xl">
            SEARCHES
          </h1>
        </div>
        <Button
          onClick={handleNewSearch}
          className="gap-2 border-2 border-foreground bg-foreground font-mono text-xs uppercase tracking-wider text-background hover:border-accent hover:bg-accent hover:text-accent-foreground"
        >
          <Plus className="h-4 w-4" />
          NEW SEARCH
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-2 border-foreground p-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-2 border-foreground bg-input pl-10 font-mono text-xs uppercase tracking-wider placeholder:text-muted-foreground"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
            <SelectTrigger className="w-36 border-2 border-foreground bg-input font-mono text-xs uppercase tracking-wider">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-2 border-foreground">
              <SelectItem value="all" className="font-mono text-xs uppercase">
                ALL
              </SelectItem>
              <SelectItem value="active" className="font-mono text-xs uppercase">
                ACTIVE
              </SelectItem>
              <SelectItem value="inactive" className="font-mono text-xs uppercase">
                PAUSED
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-0 border-2 border-foreground">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            className={cn(
              "border-r-2 border-foreground rounded-none h-10 w-10",
              viewMode === "grid"
                ? "bg-foreground text-background"
                : "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label="List view"
            className={cn(
              "rounded-none h-10 w-10",
              viewMode === "list"
                ? "bg-foreground text-background"
                : "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        SHOWING {filteredSearches.length} OF {searches.length} SEARCH{searches.length !== 1 ? "ES" : ""}
      </p>

      {/* Search Grid/List */}
      {filteredSearches.length > 0 ? (
        <div
          className={cn(
            "gap-6",
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col"
          )}
        >
          {filteredSearches.map((search) => (
            <SearchCard key={search.id} search={search} />
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-foreground p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-foreground">
            <Search className="h-8 w-8 text-foreground" />
          </div>
          <h3 className="mt-6 font-mono text-sm font-bold uppercase tracking-wider text-foreground">
            NO SEARCHES FOUND
          </h3>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {searchQuery || filterStatus !== "all"
              ? "TRY ADJUSTING YOUR FILTERS"
              : "CREATE YOUR FIRST SEARCH TO GET STARTED"}
          </p>
          {!searchQuery && filterStatus === "all" && (
            <Button
              onClick={handleNewSearch}
              className="mt-6 gap-2 border-2 border-foreground bg-foreground font-mono text-xs uppercase tracking-wider text-background hover:border-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-4 w-4" />
              CREATE SEARCH
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

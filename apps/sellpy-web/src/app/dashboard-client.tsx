"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Plus, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { SearchCard } from "@/components/search-card"
import type { Search as SearchType } from "@/lib/types"

interface DashboardClientProps {
  searches: SearchType[]
}

export default function DashboardClient({ searches }: DashboardClientProps) {
  const router = useRouter()

  const handleNewSearch = () => {
    const newId = crypto.randomUUID()
    router.push(`/searches/${newId}`)
  }

  const activeSearches = searches.filter((s) => s.isActive)
  const inactiveSearches = searches.filter((s) => !s.isActive)
  const recentSearches = [...searches]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3)

  const stats = [
    {
      title: "TOTAL",
      value: searches.length,
      icon: Search,
      description: "ALL SEARCHES",
    },
    {
      title: "ACTIVE",
      value: activeSearches.length,
      icon: CheckCircle2,
      description: "RUNNING NOW",
      highlight: true,
    },
    {
      title: "PAUSED",
      value: inactiveSearches.length,
      icon: XCircle,
      description: "INACTIVE",
    },
    {
      title: "UPDATED",
      value:
        searches.length > 0
          ? new Date(Math.max(...searches.map((s) => s.updatedAt.getTime()))).toLocaleDateString()
          : "N/A",
      icon: Clock,
      description: "LAST ACTIVITY",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Page Header */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                CONTROL CENTER
              </p>
              <h1 className="font-mono text-3xl font-bold uppercase tracking-wider text-foreground sm:text-4xl">
                DASHBOARD
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

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="group border-2 border-foreground bg-card p-6 transition-all duration-150 hover:translate-x-1 hover:-translate-y-1 hover:border-accent hover:shadow-[4px_4px_0_0_var(--accent)]"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {stat.title}
                    </p>
                    <p
                      className={`font-mono text-3xl font-bold ${
                        stat.highlight ? "text-foreground" : "text-foreground"
                      }`}
                    >
                      {stat.value}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center border-2 ${
                      stat.highlight ? "border-foreground bg-foreground" : "border-foreground bg-transparent"
                    }`}
                  >
                    <stat.icon
                      className={`h-5 w-5 ${stat.highlight ? "text-background" : "text-foreground"}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Searches */}
          <div className="space-y-6">
            <div className="flex items-end justify-between border-b-2 border-foreground pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  RECENTLY MODIFIED
                </p>
                <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-foreground">
                  RECENT SEARCHES
                </h2>
              </div>
              <Button
                variant="outline"
                asChild
                className="gap-2 border-2 border-foreground bg-transparent font-mono text-xs uppercase tracking-wider hover:border-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Link href="/searches">
                  VIEW ALL
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {recentSearches.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recentSearches.map((search) => (
                  <SearchCard key={search.id} search={search} />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-foreground p-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-foreground">
                  <Search className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="mt-6 font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                  NO SEARCHES YET
                </h3>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  CREATE YOUR FIRST SEARCH TO START SCRAPING FASHION PLATFORMS
                </p>
                <Button
                  onClick={handleNewSearch}
                  className="mt-6 gap-2 border-2 border-foreground bg-foreground font-mono text-xs uppercase tracking-wider text-background hover:border-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <Plus className="h-4 w-4" />
                  CREATE SEARCH
                </Button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="border-b-2 border-foreground pb-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                SHORTCUTS
              </p>
              <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-foreground">
                QUICK ACTIONS
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                onClick={handleNewSearch}
                className="group cursor-pointer border-2 border-foreground bg-card p-6 transition-all duration-150 hover:border-accent hover:bg-accent"
              >
                <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-foreground transition-all group-hover:border-accent-foreground group-hover:bg-accent-foreground">
                  <Plus className="h-6 w-6 text-background transition-all group-hover:text-accent" />
                </div>
                <h3 className="mt-4 font-mono text-sm font-bold uppercase tracking-wider text-foreground transition-all group-hover:text-accent-foreground">
                  CREATE SEARCH
                </h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all group-hover:text-accent-foreground/70">
                  SET UP NEW AI SEARCH PARAMETERS
                </p>
              </div>

              <Link href="/searches">
                <div className="group border-2 border-foreground bg-card p-6 transition-all duration-150 hover:border-accent hover:bg-accent">
                  <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground transition-all group-hover:border-accent-foreground">
                    <Search className="h-6 w-6 text-foreground transition-all group-hover:text-accent-foreground" />
                  </div>
                  <h3 className="mt-4 font-mono text-sm font-bold uppercase tracking-wider text-foreground transition-all group-hover:text-accent-foreground">
                    MANAGE SEARCHES
                  </h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all group-hover:text-accent-foreground/70">
                    VIEW AND EDIT CONFIGURATIONS
                  </p>
                </div>
              </Link>

              <Link href="/searches?filter=active">
                <div className="group border-2 border-foreground bg-card p-6 transition-all duration-150 hover:border-accent hover:bg-accent">
                  <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground transition-all group-hover:border-accent-foreground">
                    <CheckCircle2 className="h-6 w-6 text-foreground transition-all group-hover:text-accent-foreground" />
                  </div>
                  <h3 className="mt-4 font-mono text-sm font-bold uppercase tracking-wider text-foreground transition-all group-hover:text-accent-foreground">
                    ACTIVE SEARCHES
                  </h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all group-hover:text-accent-foreground/70">
                    MONITOR RUNNING SEARCHES
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { SearchForm } from "@/components/search-form"
import { useSearchStore } from "@/lib/search-store"
import type { Search } from "@/lib/types"

export default function SearchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const getSearch = useSearchStore((state) => state.getSearch)
  const [search, setSearch] = useState<Search | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const foundSearch = getSearch(id)
    setSearch(foundSearch)
    setIsLoading(false)
  }, [id, getSearch])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // If search exists, edit mode. Otherwise, create mode with the generated ID
  return <SearchForm search={search} mode={search ? "edit" : "create"} createId={search ? undefined : id} />
}

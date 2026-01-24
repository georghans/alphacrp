import { getSearch } from "@/db/searches"
import { mapDbSearch } from "@/lib/searches"
import { SearchForm } from "@/components/search-form"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SearchDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const row = await getSearch(params.id)
  const search = row && !row.isDeleted ? mapDbSearch(row) : undefined

  return <SearchForm search={search} mode={search ? "edit" : "create"} createId={search ? undefined : params.id} />
}

import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function MatcherRedirectPage({
  searchParams,
}: {
  searchParams?: { filter?: string }
}) {
  const filter = searchParams?.filter
  if (filter) {
    redirect(`/matches?filter=${encodeURIComponent(filter)}`)
  }
  redirect("/matches")
}

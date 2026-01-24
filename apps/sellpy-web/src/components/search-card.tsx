"use client"

import React, { useEffect, useRef, useState } from "react"

import Link from "next/link"
import Image from "next/image"
import { MoreHorizontal, Pencil, Trash2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Search } from "@/lib/types"
import { cn } from "@/lib/utils"
import { deleteSearchQuickAction, setSearchActiveAction } from "@/app/actions/searches"

interface SearchCardProps {
  search: Search
}

export function SearchCard({ search }: SearchCardProps) {
  const [isActive, setIsActive] = useState(search.isActive)
  const toggleFormRef = useRef<HTMLFormElement>(null)
  const toggleValueRef = useRef<HTMLInputElement>(null)
  const deleteFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setIsActive(search.isActive)
  }, [search.isActive])

  const handleToggle = (checked: boolean) => {
    setIsActive(checked)
    if (toggleValueRef.current) {
      toggleValueRef.current.value = checked ? "true" : "false"
    }
    toggleFormRef.current?.requestSubmit()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    deleteFormRef.current?.requestSubmit()
  }

  return (
    <Link href={`/searches/${search.id}`}>
      <div
        className={cn(
          "group relative border-2 border-foreground bg-card transition-all duration-150",
          "hover:translate-x-1 hover:-translate-y-1 hover:border-accent hover:shadow-[4px_4px_0_0_var(--accent)]"
        )}
      >
        <form ref={toggleFormRef} action={setSearchActiveAction} className="hidden">
          <input type="hidden" name="id" value={search.id} readOnly />
          <input
            ref={toggleValueRef}
            type="hidden"
            name="isActive"
            value={isActive ? "true" : "false"}
            readOnly
          />
        </form>
        <form ref={deleteFormRef} action={deleteSearchQuickAction} className="hidden">
          <input type="hidden" name="id" value={search.id} readOnly />
        </form>
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b-2 border-foreground bg-muted">
          {search.images[0] ? (
            <Image
              src={search.images[0] || "/placeholder.svg"}
              alt={search.title}
              fill
              className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="font-mono text-6xl font-bold text-muted-foreground/30">
                {search.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Status Indicator */}
          <div className="absolute left-0 top-0 border-b-2 border-r-2 border-foreground bg-background px-3 py-1">
            <div className="flex items-center gap-2">
              <Circle
                className={cn(
                  "h-2 w-2 fill-current",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
                {isActive ? "ACTIVE" : "PAUSED"}
              </span>
            </div>
          </div>

          {/* Actions Overlay */}
          <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-2 border-foreground bg-background hover:border-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-2 border-foreground">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/searches/${search.id}`}
                    className="flex items-center gap-2 font-mono text-xs uppercase"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="font-mono text-xs uppercase text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-foreground transition-colors duration-150 group-hover:text-accent line-clamp-1">
              {search.title}
            </h3>
            <div
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <Switch
                checked={isActive}
                onCheckedChange={handleToggle}
                className="shrink-0 data-[state=checked]:bg-accent"
              />
            </div>
          </div>

          <p className="font-sans text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {search.prompt}
          </p>

          {search.searchTerms && search.searchTerms.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {search.searchTerms.slice(0, 3).map((term, index) => (
                <span
                  key={index}
                  className="border border-muted-foreground px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
                >
                  {term}
                </span>
              ))}
              {search.searchTerms.length > 3 && (
                <span className="px-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  +{search.searchTerms.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t-2 border-border pt-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {search.images.length} IMG{search.images.length !== 1 ? "S" : ""}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {search.updatedAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

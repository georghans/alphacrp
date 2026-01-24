"use client"

import React, { useState } from "react"

import Link from "next/link"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/image-upload"
import type { Search } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  createSearchAction,
  deleteSearchAction,
  updateSearchAction,
} from "@/app/actions/searches"

interface SearchFormProps {
  search?: Search
  mode: "create" | "edit"
  createId?: string
}

function SaveButton({ isValid }: { isValid: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={!isValid || pending}
      className="gap-2 border-2 border-foreground bg-foreground font-mono text-xs uppercase tracking-wider text-background hover:border-accent hover:bg-accent hover:text-accent-foreground"
    >
      <Save className="h-4 w-4" />
      {pending ? "SAVING..." : "SAVE"}
    </Button>
  )
}

export function SearchForm({ search, mode, createId }: SearchFormProps) {
  const [title, setTitle] = useState(search?.title ?? "")
  const [prompt, setPrompt] = useState(search?.prompt ?? "")
  const [searchTermsInput, setSearchTermsInput] = useState(
    search?.searchTerms?.join(", ") ?? ""
  )
  const [images, setImages] = useState<string[]>(search?.images ?? [])
  const [isActive, setIsActive] = useState(search?.isActive ?? true)

  const isValid = title.trim() && prompt.trim()
  const formAction = mode === "create" ? createSearchAction : updateSearchAction
  const formId = search?.id ?? createId ?? ""

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="id" value={formId} readOnly />
      <input type="hidden" name="exampleImages" value={JSON.stringify(images)} readOnly />
      <input type="hidden" name="isActive" value={isActive ? "true" : "false"} readOnly />
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="border-2 border-foreground bg-transparent hover:border-accent hover:bg-accent hover:text-accent-foreground"
          >
            <Link href="/searches">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-mono text-xl font-bold uppercase tracking-wider text-foreground sm:text-2xl">
              {mode === "create" ? "NEW SEARCH" : "EDIT SEARCH"}
            </h1>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {mode === "create" ? "CONFIGURE AI SEARCH PARAMETERS" : "UPDATE SEARCH CONFIGURATION"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === "edit" && search && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-2 border-destructive bg-transparent font-mono text-xs uppercase tracking-wider text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">DELETE</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-2 border-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-mono text-lg uppercase tracking-wider">
                    DELETE SEARCH
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-sans text-sm text-muted-foreground">
                    Are you sure you want to delete "{search.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-2 border-foreground bg-transparent font-mono text-xs uppercase hover:border-accent hover:bg-accent hover:text-accent-foreground">
                    Cancel
                  </AlertDialogCancel>
                  <form action={deleteSearchAction}>
                    <input type="hidden" name="id" value={search.id} readOnly />
                    <AlertDialogAction
                      asChild
                      className="border-2 border-destructive bg-destructive font-mono text-xs uppercase text-destructive-foreground hover:bg-destructive/90"
                    >
                      <button type="submit">Delete</button>
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <SaveButton isValid={Boolean(isValid)} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-8 lg:col-span-2">
          <div className="border-2 border-foreground bg-card">
            <div className="border-b-2 border-foreground px-6 py-4">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                SEARCH DETAILS
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                DEFINE BASIC INFORMATION
              </p>
            </div>
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-mono text-xs uppercase tracking-wider text-foreground">
                  TITLE
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter search title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-2 border-foreground bg-input font-mono text-sm placeholder:text-muted-foreground focus:ring-0 focus:border-accent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt" className="font-mono text-xs uppercase tracking-wider text-foreground">
                  STYLE DESCRIPTION
                </Label>
                <Textarea
                  id="prompt"
                  name="searchPrompt"
                  placeholder="Describe the fashion aesthetic in detail..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-32 resize-none border-2 border-foreground bg-input font-sans text-sm placeholder:text-muted-foreground focus:ring-0 focus:border-accent"
                />
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  DESCRIBE THE AESTHETIC, KEY PIECES, AND VISUAL CHARACTERISTICS
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="searchTerms" className="font-mono text-xs uppercase tracking-wider text-foreground">
                  SEARCH TERMS
                </Label>
                <Textarea
                  id="searchTerms"
                  name="searchTerms"
                  placeholder="vintage babydoll dress, 90s grunge, mary janes..."
                  value={searchTermsInput}
                  onChange={(e) => setSearchTermsInput(e.target.value)}
                  className="min-h-20 resize-none border-2 border-foreground bg-input font-mono text-sm placeholder:text-muted-foreground focus:ring-0 focus:border-accent"
                />
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  COMMA-SEPARATED KEYWORDS THE SCRAPER WILL USE TO NARROW DOWN OFFERS
                </p>
              </div>
            </div>
          </div>

          <div className="border-2 border-foreground bg-card">
            <div className="border-b-2 border-foreground px-6 py-4">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                REFERENCE IMAGES
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                UPLOAD 1-5 IMAGES TO GUIDE AI SEARCH
              </p>
            </div>
            <div className="p-6">
              <ImageUpload images={images} onChange={setImages} maxImages={5} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="border-2 border-foreground bg-card">
            <div className="border-b-2 border-foreground px-6 py-4">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                STATUS
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                CONTROL SEARCH STATE
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="active" className="font-mono text-xs uppercase tracking-wider text-foreground">
                    {isActive ? "ACTIVE" : "PAUSED"}
                  </Label>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {isActive ? "SEARCH IS RUNNING" : "SEARCH IS PAUSED"}
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  className="data-[state=checked]:bg-accent"
                />
              </div>
            </div>
          </div>

          {mode === "edit" && search && (
            <div className="border-2 border-foreground bg-card">
              <div className="border-b-2 border-foreground px-6 py-4">
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">METADATA</h2>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">CREATED</span>
                  <span className="font-mono text-xs text-foreground">
                    {search.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">UPDATED</span>
                  <span className="font-mono text-xs text-foreground">
                    {search.updatedAt.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">IMAGES</span>
                  <span className="font-mono text-xs text-foreground">{images.length} / 5</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}

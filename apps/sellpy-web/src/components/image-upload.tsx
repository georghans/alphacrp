"use client"

import React, { useRef, useState } from "react"

import Image from "next/image"
import { Upload, X, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  searchId?: string
}

export function ImageUpload({ images, onChange, maxImages = 5, searchId }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    if (searchId) {
      formData.append("searchId", searchId)
    }

    const response = await fetch("/api/reference-images", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || "Upload failed")
    }

    const payload = (await response.json()) as { url?: string }
    if (!payload.url) {
      throw new Error("Upload failed")
    }

    return payload.url
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const remainingSlots = maxImages - images.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    if (filesToProcess.length === 0) return

    setIsUploading(true)
    try {
      const nextImages = [...images]
      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) continue
        const url = await uploadFile(file)
        nextImages.push(url)
        onChange([...nextImages])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    void handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden border-2 border-foreground bg-muted"
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`Reference image ${index + 1}`}
                fill
                className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                crossOrigin="anonymous"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center border-2 border-foreground bg-background text-foreground opacity-0 transition-all duration-150 hover:border-accent hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-0 left-0 border-r-2 border-t-2 border-foreground bg-background px-2 py-0.5">
                <span className="font-mono text-[10px] font-bold text-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div
          onDrop={isUploading ? undefined : handleDrop}
          onDragOver={isUploading ? undefined : handleDragOver}
          onDragLeave={isUploading ? undefined : handleDragLeave}
          onClick={() => {
            if (!isUploading) {
              fileInputRef.current?.click()
            }
          }}
          className={cn(
            "relative cursor-pointer border-2 border-dashed transition-all duration-150",
            isDragging ? "border-accent bg-accent/5" : "border-muted-foreground hover:border-accent",
            images.length === 0 ? "py-16" : "py-8"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => void handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className={cn(
                "flex items-center justify-center border-2 border-foreground transition-colors",
                images.length === 0 ? "h-14 w-14" : "h-12 w-12"
              )}
            >
              {images.length === 0 ? (
                <Upload className="h-6 w-6 text-foreground" />
              ) : (
                <ImagePlus className="h-5 w-5 text-foreground" />
              )}
            </div>
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                {images.length === 0 ? "DROP IMAGES OR CLICK TO UPLOAD" : "ADD MORE IMAGES"}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {images.length} / {maxImages} UPLOADED
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Max images reached message */}
      {!canAddMore && (
        <div className="border-2 border-foreground bg-muted p-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            MAXIMUM OF {maxImages} IMAGES REACHED
          </p>
        </div>
      )}
    </div>
  )
}

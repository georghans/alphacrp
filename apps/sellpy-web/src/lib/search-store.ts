"use client"

import { create } from "zustand"
import type { Search } from "./types"

interface SearchStore {
  searches: Search[]
  addSearch: (search: Omit<Search, "id" | "createdAt" | "updatedAt">, customId?: string) => Search
  updateSearch: (id: string, updates: Partial<Omit<Search, "id" | "createdAt" | "updatedAt">>) => void
  deleteSearch: (id: string) => void
  getSearch: (id: string) => Search | undefined
  toggleActive: (id: string) => void
}

// Sample data for demonstration - niche fashion aesthetics
const sampleSearches: Search[] = [
  {
    id: "1",
    title: "2000s Preppy",
    prompt: "This aesthetic is largely based on the brands Abercrombie and Fitch, Hollister, and American Eagle, which were commonly found in American malls during the 2000s, when mall culture was prominent in the mainstream. The uniting concepts behind them were sporty, laid-back interpretations of New England Preppy garments, which were also based on sporty fashions, albeit in a more vintage and 'stuffy' context. These brands also incorporated California in their marketing, with connections to Surfer culture and aspirationally attractive models. This is especially true for brands such as Hollister Co. and Pac Sun and with TV shows such as The Hills, Laguna Beach, and The OC. Look for polo shirts with popped collars, distressed denim with heavy whiskering, graphic tees with vintage-wash effects, cargo shorts, layered camisoles, low-rise jeans, flip flops, puka shell necklaces, and oversized hoodies with brand logos.",
    searchTerms: ["abercrombie fitch vintage", "hollister 2000s", "american eagle y2k", "low rise jeans", "popped collar polo", "puka shell necklace", "distressed denim 00s"],
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=300&fit=crop",
    ],
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    title: "Japanese Horror Game Protagonist",
    prompt: "Japanese Horror Game Protagonist fashion is a TikTok microtrend wherein young women create outfits inspired by the female protagonists in popular Japanese horror games, most notably the Fatal Frame series. The fashion is largely built upon the concurrent social media youth fashion trend, Coquette, specifically the Dark Coquette subtype, in addition to Grunge/Soft Grunge influences. It largely depends on the use of dark-colored pieces from hyper-feminine brands from Japan and generous accessories. Key elements include delicate black lace details, oversized cardigans or school uniform-inspired pieces, mary jane shoes, knee-high socks, pleated mini skirts in dark colors, chokers, cross necklaces, and an overall aesthetic that blends innocent femininity with unsettling darkness. Hair is often styled with bangs or face-framing layers.",
    searchTerms: ["dark coquette", "japanese lolita black", "fatal frame cosplay", "gothic mary janes", "black lace blouse", "pleated skirt dark", "school uniform goth"],
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=300&fit=crop",
    ],
    isActive: true,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
  },
  {
    id: "3",
    title: "Kinderwhore",
    prompt: "Kinderwhore is a fashion style that emerged in the early to mid-1990s, primarily worn by female musicians within the punk and grunge scenes in the United States. This aesthetic combines elements of childlike innocence with overt, often disheveled, sexuality. Key pieces include vintage babydoll dresses (often torn or safety-pinned), peter pan collars, smeared or exaggerated makeup (particularly red lipstick and heavy eyeliner), barrettes and hair clips, mary jane shoes, knee-high socks (often mismatched or torn), vintage slips worn as dresses, tiara or plastic jewelry, and an overall 'thrift store chic' appearance. The look was popularized by Courtney Love, Kat Bjelland, and other Riot Grrrl adjacent musicians as a commentary on feminine presentation and reclaiming agency.",
    searchTerms: ["vintage babydoll dress 90s", "courtney love style", "riot grrrl fashion", "peter pan collar dress", "grunge slip dress", "vintage mary janes", "90s barrettes hair"],
    images: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop",
    ],
    isActive: false,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-12"),
  },
]

export const useSearchStore = create<SearchStore>((set, get) => ({
  searches: sampleSearches,
  
  addSearch: (searchData, customId) => {
    const newSearch: Search = {
      ...searchData,
      searchTerms: searchData.searchTerms ?? [],
      id: customId ?? crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => ({
      searches: [...state.searches, newSearch],
    }))
    return newSearch
  },
  
  updateSearch: (id, updates) => {
    set((state) => ({
      searches: state.searches.map((search) =>
        search.id === id
          ? { ...search, ...updates, updatedAt: new Date() }
          : search
      ),
    }))
  },
  
  deleteSearch: (id) => {
    set((state) => ({
      searches: state.searches.filter((search) => search.id !== id),
    }))
  },
  
  getSearch: (id) => {
    return get().searches.find((search) => search.id === id)
  },
  
  toggleActive: (id) => {
    set((state) => ({
      searches: state.searches.map((search) =>
        search.id === id
          ? { ...search, isActive: !search.isActive, updatedAt: new Date() }
          : search
      ),
    }))
  },
}))

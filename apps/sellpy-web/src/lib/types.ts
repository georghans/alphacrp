export interface Search {
  id: string
  title: string
  prompt: string
  searchTerms: string[]
  images: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

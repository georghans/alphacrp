import type { Search } from "./types";

type DbSearch = {
  id: string;
  title: string;
  searchPrompt: string | null;
  searchTerms: unknown;
  exampleImages: unknown;
  isActive: boolean;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  isDeleted?: boolean | null;
};

const toDate = (value: Date | string | null | undefined) => {
  if (!value) return new Date(0);
  return value instanceof Date ? value : new Date(value);
};

const toStringArray = (value: unknown) => {
  if (!value) return [] as string[];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).filter(Boolean);
  }
  return [] as string[];
};

export function mapDbSearch(row: DbSearch): Search {
  return {
    id: row.id,
    title: row.title,
    prompt: row.searchPrompt ?? "",
    searchTerms: toStringArray(row.searchTerms),
    images: toStringArray(row.exampleImages),
    isActive: Boolean(row.isActive),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt)
  };
}

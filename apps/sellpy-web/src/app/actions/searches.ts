"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  countSearches,
  createSearch,
  getSearch,
  softDeleteSearch,
  updateSearch
} from "../../db/searches";

function parseLines(value: FormDataEntryValue | null) {
  if (!value) return [];
  return String(value)
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function createSearchAction(formData: FormData) {
  const titleInput = String(formData.get("title") ?? "").trim();
  const searchTerms = parseLines(formData.get("searchTerms"));
  const searchPrompt = String(formData.get("searchPrompt") ?? "").trim();
  const exampleImages = parseLines(formData.get("exampleImages"));
  const isActive = formData.get("isActive") === "on";

  if (searchTerms.length === 0) {
    throw new Error("Search terms are required");
  }

  if (!searchPrompt) {
    throw new Error("Search prompt is required");
  }

  if (exampleImages.length < 1 || exampleImages.length > 5) {
    throw new Error("Example images must be between 1 and 5");
  }

  const count = await countSearches();
  const title = titleInput || `Search #${count + 1}`;

  const search = await createSearch({
    title,
    searchTerms,
    searchPrompt,
    exampleImages,
    isActive
  });

  if (!search) {
    throw new Error("Failed to create search");
  }

  revalidatePath("/searches");
  redirect(`/searches/${search.id}`);
}

export async function updateSearchAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Missing search id");
  }

  const existing = await getSearch(id);
  if (!existing) {
    throw new Error("Search not found");
  }

  const titleInput = String(formData.get("title") ?? "").trim();
  const searchTerms = parseLines(formData.get("searchTerms"));
  const searchPrompt = String(formData.get("searchPrompt") ?? "").trim();
  const exampleImages = parseLines(formData.get("exampleImages"));
  const isActive = formData.get("isActive") === "on";

  if (searchTerms.length === 0) {
    throw new Error("Search terms are required");
  }

  if (!searchPrompt) {
    throw new Error("Search prompt is required");
  }

  if (exampleImages.length < 1 || exampleImages.length > 5) {
    throw new Error("Example images must be between 1 and 5");
  }

  await updateSearch(id, {
    title: titleInput || existing.title,
    searchTerms,
    searchPrompt,
    exampleImages,
    isActive
  });

  revalidatePath("/searches");
  revalidatePath(`/searches/${id}`);
}

export async function deleteSearchAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Missing search id");
  }

  const search = await getSearch(id);
  if (!search) {
    throw new Error("Search not found");
  }

  await softDeleteSearch(id);
  revalidatePath("/searches");
  redirect("/searches");
}

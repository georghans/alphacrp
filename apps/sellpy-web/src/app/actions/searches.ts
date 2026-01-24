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

function parseList(value: FormDataEntryValue | null) {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      // Fall through to delimiter parsing.
    }
  }
  return raw
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseBoolean(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").toLowerCase();
  return raw === "1" || raw === "true" || raw === "on";
}

export async function createSearchAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const titleInput = String(formData.get("title") ?? "").trim();
  const searchTerms = parseList(formData.get("searchTerms"));
  const searchPrompt = String(formData.get("searchPrompt") ?? "").trim();
  const exampleImages = parseList(formData.get("exampleImages"));
  const isActive = parseBoolean(formData.get("isActive"));

  const count = await countSearches();
  const title = titleInput || `Search #${count + 1}`;

  const search = await createSearch({
    id: id || undefined,
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
  revalidatePath("/");
  redirect("/searches");
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
  const searchTerms = parseList(formData.get("searchTerms"));
  const searchPrompt = String(formData.get("searchPrompt") ?? "").trim();
  const exampleImages = parseList(formData.get("exampleImages"));
  const isActive = parseBoolean(formData.get("isActive"));

  await updateSearch(id, {
    title: titleInput || existing.title,
    searchTerms,
    searchPrompt,
    exampleImages,
    isActive
  });

  revalidatePath("/searches");
  revalidatePath(`/searches/${id}`);
  revalidatePath("/");
  redirect("/searches");
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
  revalidatePath("/");
  redirect("/searches");
}

export async function deleteSearchQuickAction(formData: FormData) {
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
  revalidatePath("/");
}

export async function setSearchActiveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("Missing search id");
  }

  await updateSearch(id, { isActive: parseBoolean(formData.get("isActive")) });
  revalidatePath("/searches");
  revalidatePath("/");
}

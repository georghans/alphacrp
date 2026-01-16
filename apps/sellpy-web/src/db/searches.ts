import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./client";
import { searches } from "./schema";

export type SearchInsert = {
  title: string;
  searchTerms: string[];
  searchPrompt: string;
  exampleImages: string[];
  isActive: boolean;
};

export async function listSearches() {
  const db = getDb();
  return db
    .select()
    .from(searches)
    .where(eq(searches.isDeleted, false))
    .orderBy(desc(searches.createdAt));
}

export async function getSearch(id: string) {
  const db = getDb();
  const rows = await db.select().from(searches).where(eq(searches.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function countSearches() {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(searches)
    .where(eq(searches.isDeleted, false));
  return Number(rows[0]?.count ?? 0);
}

export async function createSearch(data: SearchInsert) {
  const db = getDb();
  const rows = await db
    .insert(searches)
    .values({
      title: data.title,
      searchTerms: data.searchTerms,
      searchPrompt: data.searchPrompt,
      exampleImages: data.exampleImages,
      isActive: data.isActive,
      isDeleted: false
    })
    .returning();

  return rows[0] ?? null;
}

export async function updateSearch(
  id: string,
  data: Partial<Omit<SearchInsert, "isDeleted">> & { isDeleted?: boolean }
) {
  const db = getDb();
  await db
    .update(searches)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(searches.id, id));
}

export async function softDeleteSearch(id: string) {
  await updateSearch(id, { isDeleted: true, isActive: false });
}

export async function listActiveSearches() {
  const db = getDb();
  return db
    .select()
    .from(searches)
    .where(and(eq(searches.isDeleted, false), eq(searches.isActive, true)));
}

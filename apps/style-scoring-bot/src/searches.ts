import drizzleApi from "../../../packages/shared-db/src/drizzle.ts";
import { db } from "./db/client.js";
import { StyleProfileInput } from "../evaluator/schemas.js";
import * as schema from "../../../packages/shared-db/src/schema.ts";

const { eq } = drizzleApi;
const { searches } = schema;

export async function createSearch(input: StyleProfileInput) {
  const rows = await db
    .insert(searches)
    .values({
      title: input.name,
      searchTerms: [],
      searchPrompt: input.style_prompt,
      exampleImages: input.example_images,
      isActive: true,
      isDeleted: false
    })
    .returning();

  const search = rows[0];
  if (!search) {cd
    throw new Error("Failed to create search");
  }
  return search;
}

export async function getSearch(id: string) {
  const rows = await db.select().from(searches).where(eq(searches.id, id)).limit(1);
  return rows[0] ?? null;
}

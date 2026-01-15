import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { StyleProfileInput } from "../evaluator/schemas.js";
import { styleProfiles } from "../../../packages/shared-db/src/schema.js";

export async function createStyleProfile(input: StyleProfileInput) {
  const rows = await db
    .insert(styleProfiles)
    .values({
      name: input.name,
      stylePrompt: input.style_prompt,
      exampleImages: input.example_images
    })
    .returning();

  const profile = rows[0];
  if (!profile) {
    throw new Error("Failed to create style profile");
  }
  return profile;
}

export async function getStyleProfile(id: string) {
  const rows = await db.select().from(styleProfiles).where(eq(styleProfiles.id, id)).limit(1);
  return rows[0] ?? null;
}

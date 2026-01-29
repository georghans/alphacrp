import drizzleApi from "../../../../packages/shared-db/src/drizzle.ts";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../../../packages/shared-db/src/schema.ts";

const resolvedDrizzle =
  (drizzleApi as typeof drizzleApi & { default?: typeof drizzleApi }).default ??
  drizzleApi;
const { eq } = resolvedDrizzle;
const resolvedSchema =
  (schema as typeof schema & { default?: typeof schema }).default ?? schema;
const { searches } = resolvedSchema;

export async function resolveSearchId(
  db: NodePgDatabase,
  term: string,
  searchId: string | undefined
): Promise<string> {
  if (searchId) {
    return searchId;
  }

  const existing = await db
    .select({ id: searches.id })
    .from(searches)
    .where(eq(searches.title, "Legacy Search"))
    .limit(1);

  if (existing[0]?.id) {
    return existing[0].id;
  }

  const rows = await db
    .insert(searches)
    .values({
      title: "Legacy Search",
      searchTerms: [term],
      searchPrompt: "Legacy import",
      exampleImages: [],
      isActive: true,
      isDeleted: false
    })
    .returning({ id: searches.id });

  if (!rows[0]?.id) {
    throw new Error("Failed to resolve search id");
  }
  return rows[0].id;
}

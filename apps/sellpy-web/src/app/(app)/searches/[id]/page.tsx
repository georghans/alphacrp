import { notFound } from "next/navigation";
import { getSearch } from "../../../../db/searches";
import { deleteSearchAction, updateSearchAction } from "../../../actions/searches";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SearchDetailPage({
  params
}: {
  params: { id: string };
}) {
  let search: Awaited<ReturnType<typeof getSearch>> | null = null;
  let errorMessage = "";
  try {
    search = await getSearch(params.id);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Database unavailable";
  }
  if (!search || search.isDeleted) {
    if (errorMessage) {
      return (
        <div className="card">
          <div className="card-title">Database not connected</div>
          <p className="muted">{errorMessage}</p>
        </div>
      );
    }
    notFound();
  }

  const searchTerms = Array.isArray(search.searchTerms) ? search.searchTerms.join("\n") : "";
  const exampleImages = Array.isArray(search.exampleImages) ? search.exampleImages.join("\n") : "";

  return (
    <div>
      <h1 className="section-title">{search.title}</h1>
      <p className="muted">Edit the search parameters</p>

      <div className="card" style={{ marginTop: 24 }}>
        <form className="form" action={updateSearchAction}>
          <input type="hidden" name="id" value={search.id} />
          <div className="field">
            <label className="label" htmlFor="title">
              Title
            </label>
            <input className="input" id="title" name="title" defaultValue={search.title} />
          </div>
          <div className="field">
            <label className="label" htmlFor="searchTerms">
              Search terms
            </label>
            <textarea
              className="textarea"
              id="searchTerms"
              name="searchTerms"
              defaultValue={searchTerms}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="searchPrompt">
              Search prompt
            </label>
            <textarea
              className="textarea"
              id="searchPrompt"
              name="searchPrompt"
              defaultValue={search.searchPrompt}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="exampleImages">
              Example images (1-5)
            </label>
            <textarea
              className="textarea"
              id="exampleImages"
              name="exampleImages"
              defaultValue={exampleImages}
              required
            />
          </div>
          <label className="field" style={{ gridAutoFlow: "column", alignItems: "center" }}>
            <span className="label">Active</span>
            <input
              className="checkbox"
              type="checkbox"
              name="isActive"
              defaultChecked={search.isActive}
            />
          </label>
          <div className="inline-actions">
            <button className="button" type="submit">
              Save
            </button>
          </div>
        </form>
        <form action={deleteSearchAction} style={{ marginTop: 12 }}>
          <input type="hidden" name="id" value={search.id} />
          <button className="button secondary" type="submit">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

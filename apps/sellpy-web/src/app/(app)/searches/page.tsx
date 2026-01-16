import Link from "next/link";
import { listSearches } from "../../../db/searches";
import { createSearchAction } from "../../actions/searches";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SearchesPage() {
  let searches: Awaited<ReturnType<typeof listSearches>> = [];
  let errorMessage = "";
  try {
    searches = await listSearches();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Database unavailable";
  }

  return (
    <div>
      <h1 className="section-title">Searches</h1>
      <p className="muted">Define what to hunt for</p>

      {errorMessage ? (
        <div className="card" style={{ marginTop: 24, marginBottom: 28 }}>
          <div className="card-title">Database not connected</div>
          <p className="muted">{errorMessage}</p>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 24, marginBottom: 28 }}>
        <div className="card-title">New search</div>
        <form className="form" action={createSearchAction}>
          <div className="field">
            <label className="label" htmlFor="title">
              Title (optional)
            </label>
            <input className="input" id="title" name="title" placeholder="Search #" />
          </div>
          <div className="field">
            <label className="label" htmlFor="searchTerms">
              Search terms
            </label>
            <textarea
              className="textarea"
              id="searchTerms"
              name="searchTerms"
              placeholder="One term per line"
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
              placeholder="Natural language description"
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
              placeholder="One image URL per line"
              required
            />
          </div>
          <label className="field" style={{ gridAutoFlow: "column", alignItems: "center" }}>
            <span className="label">Active</span>
            <input className="checkbox" type="checkbox" name="isActive" defaultChecked />
          </label>
          <button className="button" type="submit">
            Create
          </button>
        </form>
      </div>
      )}

      <div className="grid">
        {searches.map((search) => (
          <Link key={search.id} href={`/searches/${search.id}`} className="card">
            <div className="card-title">{search.title}</div>
            <div className={`badge ${search.isActive ? "active" : ""}`}>
              {search.isActive ? "Active" : "Inactive"}
            </div>
            <div className="muted">Terms</div>
            <div>{Array.isArray(search.searchTerms) ? search.searchTerms.join(", ") : ""}</div>
            <div className="muted">Prompt</div>
            <div style={{ fontSize: 14 }}>{search.searchPrompt}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

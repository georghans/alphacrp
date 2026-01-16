import { listSearches } from "../../../db/searches";
import { listMatchingOffers } from "../../../db/offers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OffersPage({
  searchParams
}: {
  searchParams?: { searchId?: string };
}) {
  let searches: Awaited<ReturnType<typeof listSearches>> = [];
  let offers: Awaited<ReturnType<typeof listMatchingOffers>> = [];
  let errorMessage = "";
  const selectedSearch = searchParams?.searchId || "";
  try {
    searches = await listSearches();
    offers = await listMatchingOffers(selectedSearch || undefined);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Database unavailable";
  }

  return (
    <div>
      <h1 className="section-title">Matches</h1>
      <p className="muted">Filtered by style profile matches</p>

      {errorMessage ? (
        <div className="card" style={{ marginTop: 24, marginBottom: 28 }}>
          <div className="card-title">Database not connected</div>
          <p className="muted">{errorMessage}</p>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 24, marginBottom: 28 }}>
          <form className="form" action="/offers" method="get">
            <div className="field">
              <label className="label" htmlFor="searchId">
                Filter by search
              </label>
              <select className="select" id="searchId" name="searchId" defaultValue={selectedSearch}>
                <option value="">All searches</option>
                {searches.map((search) => (
                  <option key={search.id} value={search.id}>
                    {search.title}
                  </option>
                ))}
              </select>
            </div>
            <button className="button" type="submit">
              Apply
            </button>
          </form>
        </div>
      )}

      {errorMessage ? null : offers.length === 0 ? (
        <div className="card">
          <div className="card-title">No matches yet</div>
          <p className="muted">Let the matcher run a few cycles.</p>
        </div>
      ) : (
        <div className="grid">
          {offers.map((offer) => (
            <a
              key={offer.id}
              href={offer.url}
              target="_blank"
              rel="noreferrer"
              className="card offer-card"
            >
              {offer.imageUrl ? (
                <img className="offer-image" src={offer.imageUrl} alt={offer.title} />
              ) : (
                <div
                  className="offer-image"
                  style={{ display: "grid", placeItems: "center", fontSize: 12 }}
                >
                  No image
                </div>
              )}
              <div className="offer-content">
                <div className="card-title">{offer.title}</div>
                <div className="muted">{offer.searchTitle}</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

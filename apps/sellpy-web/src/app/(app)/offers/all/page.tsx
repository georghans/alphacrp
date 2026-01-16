import { listSearches } from "../../../../db/searches";
import { listOffers } from "../../../../db/offers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolveImage(imageData: string | null, imageMime: string | null, imageUrl: string | null) {
  if (imageData) {
    if (imageData.startsWith("data:")) return imageData;
    const mime = imageMime ?? "image/jpeg";
    return `data:${mime};base64,${imageData}`;
  }
  return imageUrl;
}

export default async function AllOffersPage({
  searchParams
}: {
  searchParams?: { searchId?: string; limit?: string };
}) {
  const searches = await listSearches();
  const selectedSearch = searchParams?.searchId || "";
  const limit = Number(searchParams?.limit ?? 60) || 60;
  const offers = await listOffers(selectedSearch || undefined, Math.min(limit, 200));

  return (
    <div>
      <h1 className="section-title">All Offers</h1>
      <p className="muted">Stored offers with screenshots</p>

      <div className="card" style={{ marginTop: 24, marginBottom: 28 }}>
        <form className="form" action="/offers/all" method="get">
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
          <div className="field">
            <label className="label" htmlFor="limit">
              Limit
            </label>
            <input className="input" id="limit" name="limit" type="number" min={1} max={200} defaultValue={limit} />
          </div>
          <button className="button" type="submit">
            Apply
          </button>
        </form>
      </div>

      {offers.length === 0 ? (
        <div className="card">
          <div className="card-title">No offers yet</div>
          <p className="muted">Run the scraper to populate offers.</p>
        </div>
      ) : (
        <div className="grid">
          {offers.map((offer) => {
            const image = resolveImage(offer.imageData, offer.imageMime, offer.imageUrl);
            return (
              <a
                key={offer.id}
                href={offer.url}
                target="_blank"
                rel="noreferrer"
                className="card offer-card"
              >
                {image ? (
                  <img className="offer-image" src={image} alt={offer.title} />
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
            );
          })}
        </div>
      )}
    </div>
  );
}

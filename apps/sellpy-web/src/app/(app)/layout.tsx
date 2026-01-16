import Link from "next/link";
import { logout } from "../actions/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="nav">
        <div className="nav-title">Sellpy Gallery</div>
        <div className="nav-links">
          <Link href="/searches">Searches</Link>
          <Link href="/offers">Matches</Link>
          <Link href="/offers/all">All offers</Link>
        </div>
        <div className="nav-actions">
          <form action={logout}>
            <button type="submit" className="button secondary">
              Logout
            </button>
          </form>
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
}

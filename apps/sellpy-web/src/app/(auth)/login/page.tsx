import { login } from "../../actions/auth";

export default function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const hasError = Boolean(searchParams?.error);

  return (
    <div className="card" style={{ maxWidth: 420, margin: "12vh auto" }}>
      <div className="card-title">Enter Gallery</div>
      <p className="muted">Single-user access</p>
      <form className="form" action={login}>
        <div className="field">
          <label className="label" htmlFor="username">
            Username
          </label>
          <input className="input" id="username" name="username" type="text" required />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input className="input" id="password" name="password" type="password" required />
        </div>
        {hasError && (
          <div style={{ color: "var(--accent)", fontSize: 13, letterSpacing: "0.08em" }}>
            Invalid credentials
          </div>
        )}
        <button className="button" type="submit">
          Log in
        </button>
      </form>
    </div>
  );
}

export const AUTH_COOKIE = "sellpy_auth";

export function getCredentials() {
  return {
    password: process.env.APP_PASSWORD ?? "admin"
  };
}

export function isValidCredentials(password: string) {
  const creds = getCredentials();
  return password === creds.password;
}

export const AUTH_COOKIE = "sellpy_auth";

export function getCredentials() {
  return {
    username: process.env.APP_USERNAME ?? "admin",
    password: process.env.APP_PASSWORD ?? "admin"
  };
}

export function isValidCredentials(username: string, password: string) {
  const creds = getCredentials();
  return username === creds.username && password === creds.password;
}

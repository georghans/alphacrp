export function normalizeUrl(input: string): string {
  try {
    const url = new URL(input);
    url.hash = "";
    const params = Array.from(url.searchParams.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    url.search = "";
    for (const [key, value] of params) {
      url.searchParams.append(key, value);
    }
    return url.toString();
  } catch {
    return input;
  }
}

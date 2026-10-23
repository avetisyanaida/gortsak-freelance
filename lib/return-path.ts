export function safeReturnPath(value: string, fallback = "/market.html") {
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "https://gortsak.invalid");
    if (url.origin !== "https://gortsak.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

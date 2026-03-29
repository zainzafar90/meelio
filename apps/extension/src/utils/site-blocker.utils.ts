export function normalizeSiteHost(input: string): string {
  const value = input.trim().toLowerCase();

  try {
    const withProtocol = value.includes("://") ? value : `https://${value}`;
    const normalized = new URL(withProtocol);
    return normalized.hostname.replace(/^www\./, "");
  } catch {
    const match = value.match(/([a-z0-9.-]+\.[a-z]{2,})/i);
    return match ? match[1].replace(/^www\./, "") : value;
  }
}

export function doesSiteHostMatch(host: string, site: string): boolean {
  const normalizedHost = normalizeSiteHost(host);
  const normalizedSite = normalizeSiteHost(site);

  return (
    normalizedHost === normalizedSite ||
    normalizedHost.endsWith(`.${normalizedSite}`)
  );
}

import { describe, expect, it } from "vitest";

import { doesSiteHostMatch, normalizeSiteHost } from "./site-blocker.utils";

describe("site-blocker.utils", () => {
  it("normalizes host input consistently", () => {
    expect(normalizeSiteHost("https://www.Example.com/path")).toBe("example.com");
    expect(normalizeSiteHost("example.com")).toBe("example.com");
  });

  it("matches exact and subdomain hosts", () => {
    expect(doesSiteHostMatch("example.com", "example.com")).toBe(true);
    expect(doesSiteHostMatch("news.example.com", "example.com")).toBe(true);
    expect(doesSiteHostMatch("example.org", "example.com")).toBe(false);
  });
});

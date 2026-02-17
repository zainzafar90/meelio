import { afterEach, describe, expect, it, vi } from "vitest";

import { getFaviconUrl } from "./domain.utils";

describe("getFaviconUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds favicon url from a valid URL", () => {
    expect(getFaviconUrl("https://example.com/path")).toBe(
      "https://www.google.com/s2/favicons?domain=example.com&sz=32"
    );
  });

  it("falls back to the raw value for invalid URL strings", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(getFaviconUrl("not-a-valid-url")).toBe(
      "https://www.google.com/s2/favicons?domain=not-a-valid-url&sz=32"
    );
    expect(warnSpy).toHaveBeenCalled();
  });
});

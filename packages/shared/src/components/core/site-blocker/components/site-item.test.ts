import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { SITE_LIST } from "../data/site-list";
import { SiteItem } from "./site-item";

vi.mock("../../../../i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const findElementByType = (node: ReactNode, type: string) => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElementByType(child, type);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (!isValidElement(node)) {
    return null;
  }

  if (node.type === type) {
    return node;
  }

  return findElementByType(node.props.children, type);
};

describe("SiteItem", () => {
  it("renders preset logos in a padded viewport so they do not appear clipped", () => {
    const site = SITE_LIST["entertainment-group"].find(
      (candidate) => candidate.id === "netflix"
    );

    expect(site?.icon).toBeDefined();

    const tree = SiteItem({
      site: site!,
      isBlocked: false,
      onToggle: () => undefined,
    });
    const svg = findElementByType(tree, "svg");

    expect(svg).not.toBeNull();
    expect(svg?.props.viewBox).toBe("-2 -2 28 28");
    expect(svg?.props.preserveAspectRatio).toBe("xMidYMid meet");
  });
});

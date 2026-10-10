import { describe, expect, it } from "vitest";
import { toPublicAd } from "./ads";

describe("toPublicAd", () => {
  it("returns only allowlisted public obituary fields", () => {
    const publicAd = toPublicAd({
      _id: "ad-id",
      name: "Mari Mets",
      slug: "mari-mets",
      email: "mari@example.com",
      adminNote: "private",
      managementToken: "secret",
      birthYear: "1930-01-01",
      deathYear: "2026-01-01",
      poem: "Poem",
      topText: "Teatame kurbusega",
      bottomText: "Leinavad lapsed",
      createdAt: "2026-01-02T00:00:00.000Z",
    });

    expect(publicAd).toEqual({
      _id: "ad-id",
      name: "Mari Mets",
      slug: "mari-mets",
      birthYear: "1930-01-01",
      deathYear: "2026-01-01",
      poem: "Poem",
      topText: "Teatame kurbusega",
      bottomText: "Leinavad lapsed",
      createdAt: "2026-01-02T00:00:00.000Z",
    });
    expect(publicAd).not.toHaveProperty("email");
    expect(publicAd).not.toHaveProperty("adminNote");
    expect(publicAd).not.toHaveProperty("managementToken");
  });
});

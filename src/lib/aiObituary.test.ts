import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createAiGeneratedAd = vi.fn();
const findAiGeneratedAdByKey = vi.fn();

vi.mock("./ads", () => ({
  createAiGeneratedAd,
  findAiGeneratedAdByKey,
}));

const generatedPayload = {
  name: "AI Kuulutus",
  birthYear: "1930-01-01",
  deathYear: "2026-01-01",
  topText: "Teatame kurbusega",
  poem: "Vaikne mälestus jääb.",
  bottomText: "Leinavad omaksed",
};

describe("generateDailyAiObituary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T06:00:00.000Z"));
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "openai-key";
    findAiGeneratedAdByKey.mockResolvedValue(null);
    createAiGeneratedAd.mockResolvedValue({
      created: true,
      ad: { name: "AI Kuulutus", slug: "ai-kuulutus" },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ output_text: JSON.stringify(generatedPayload) }),
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
  });

  it("uses the workflow run id to create a retry-safe daily generation key", async () => {
    const { generateDailyAiObituary } = await import("./aiObituary");

    await generateDailyAiObituary("987654");

    expect(findAiGeneratedAdByKey).toHaveBeenCalledWith("2026-10-13:987654");
    expect(createAiGeneratedAd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "AI Kuulutus",
        email: "automaat@surmakuulutus.ee",
      }),
      "2026-10-13",
      "2026-10-13:987654",
    );
  });

  it("does not call OpenAI again when the same workflow run is retried", async () => {
    const existingAd = { name: "AI Kuulutus", slug: "ai-kuulutus" };
    findAiGeneratedAdByKey.mockResolvedValue(existingAd);
    const { generateDailyAiObituary } = await import("./aiObituary");

    const result = await generateDailyAiObituary("987654");

    expect(result).toEqual({ created: false, ad: existingAd });
    expect(fetch).not.toHaveBeenCalled();
    expect(createAiGeneratedAd).not.toHaveBeenCalled();
  });
});

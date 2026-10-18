import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import victims from "../data/kommunismiohvrid.json";

const createAiGeneratedAd = vi.fn();
const findAiGeneratedAdByKey = vi.fn();

vi.mock("./ads", () => ({
  createAiGeneratedAd,
  findAiGeneratedAdByKey,
}));

const generatedPayload = {
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
    const [values, date, key] = createAiGeneratedAd.mock.calls[0];
    const victim = victims.find((item) => item.name === values.name &&
      `${item.birthDate.slice(6)}-${item.birthDate.slice(3, 5)}-${item.birthDate.slice(0, 2)}` === values.birthYear &&
      `${item.deathDate.slice(6)}-${item.deathDate.slice(3, 5)}-${item.deathDate.slice(0, 2)}` === values.deathYear);
    expect(victim).toBeDefined();
    expect(values.email).toBe("automaat@surmakuulutus.ee");
    expect(date).toBe("2026-10-13");
    expect(key).toBe("2026-10-13:987654");
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

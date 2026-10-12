import { beforeEach, describe, expect, it, vi } from "vitest";

const generateDailyAiObituary = vi.fn();

vi.mock("../../../lib/aiObituary", () => ({
  generateDailyAiObituary,
}));

function postRequest(secret?: string) {
  return new Request("https://surmakuulutus.ee/api/ai-obituary", {
    method: "POST",
    headers: secret ? { authorization: `Bearer ${secret}` } : undefined,
  });
}

describe("POST /api/ai-obituary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_GENERATION_SECRET = "cron-secret";
    generateDailyAiObituary.mockResolvedValue({
      created: true,
      ad: { name: "AI Kuulutus", slug: "ai-kuulutus" },
    });
  });

  it("rejects anonymous requests before generation", async () => {
    const { POST } = await import("./route");
    const response = await POST(postRequest());

    expect(response.status).toBe(401);
    expect(generateDailyAiObituary).not.toHaveBeenCalled();
  });

  it("rejects requests when internal secret is missing", async () => {
    delete process.env.AI_GENERATION_SECRET;

    const { POST } = await import("./route");
    const response = await POST(postRequest("cron-secret"));

    expect(response.status).toBe(401);
    expect(generateDailyAiObituary).not.toHaveBeenCalled();
  });

  it("runs generation for authorized internal requests", async () => {
    const { POST } = await import("./route");
    const response = await POST(postRequest("cron-secret"));

    expect(response.status).toBe(201);
    expect(generateDailyAiObituary).toHaveBeenCalledTimes(1);
  });
});

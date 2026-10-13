import { beforeEach, describe, expect, it, vi } from "vitest";

const generateDailyAiObituary = vi.fn();

vi.mock("../../../lib/aiObituary", () => ({
  generateDailyAiObituary,
}));

function postRequest(secret?: string, runId = "123456") {
  return new Request("https://surmakuulutus.ee/api/ai-obituary", {
    method: "POST",
    headers: secret
      ? {
          authorization: `Bearer ${secret}`,
          "x-github-run-id": runId,
        }
      : undefined,
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
    expect(generateDailyAiObituary).toHaveBeenCalledWith("123456");
  });

  it("ignores accidental whitespace around configured secret", async () => {
    process.env.AI_GENERATION_SECRET = " cron-secret \n";

    const { POST } = await import("./route");
    const response = await POST(postRequest("cron-secret"));

    expect(response.status).toBe(201);
    expect(generateDailyAiObituary).toHaveBeenCalledTimes(1);
  });

  it("keeps manual triggering working without a run id header", async () => {
    const { POST } = await import("./route");
    const response = await POST(postRequest("cron-secret", ""));

    expect(response.status).toBe(201);
    expect(generateDailyAiObituary).toHaveBeenCalledWith(undefined);
  });
});

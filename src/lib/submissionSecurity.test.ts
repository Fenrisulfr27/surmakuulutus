import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "./submissionSecurity";

const originalSecret = process.env.TURNSTILE_SECRET_KEY;

afterEach(() => {
  process.env.TURNSTILE_SECRET_KEY = originalSecret;
  vi.restoreAllMocks();
});

describe("verifyTurnstileToken", () => {
  it("rejects verification when Turnstile secret is not configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;

    await expect(
      verifyTurnstileToken("token", "203.0.113.7", vi.fn()),
    ).resolves.toEqual({
      success: false,
      reason: "not_configured",
    });
  });

  it("accepts valid Turnstile tokens", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await expect(
      verifyTurnstileToken("valid-token", "203.0.113.7", fetchImpl),
    ).resolves.toEqual({ success: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
        body: expect.any(URLSearchParams),
      }),
    );
  });

  it("rejects invalid, expired, or reused Turnstile tokens", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      }),
    });

    await expect(
      verifyTurnstileToken("used-token", "203.0.113.7", fetchImpl),
    ).resolves.toEqual({
      success: false,
      reason: "invalid",
      errorCodes: ["timeout-or-duplicate"],
    });
  });
});

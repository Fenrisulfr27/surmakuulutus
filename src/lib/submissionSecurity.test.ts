import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedSubmissionOrigin, verifyTurnstileToken } from "./submissionSecurity";

const originalSecret = process.env.TURNSTILE_SECRET_KEY;
const originalAllowedHostnames = process.env.TURNSTILE_ALLOWED_HOSTNAMES;
const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  process.env.TURNSTILE_SECRET_KEY = originalSecret;
  process.env.TURNSTILE_ALLOWED_HOSTNAMES = originalAllowedHostnames;
  process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("isAllowedSubmissionOrigin", () => {
  it("rejects direct production API calls without an Origin header", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(isAllowedSubmissionOrigin(
      new Request("https://surmakuulutus.ee/api/ads", { method: "POST" }),
    )).toBe(false);
  });

  it("rejects cross-site production browser submissions", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(isAllowedSubmissionOrigin(
      new Request("https://surmakuulutus.ee/api/ads", {
        method: "POST",
        headers: { origin: "https://evil.example" },
      }),
    )).toBe(false);
  });

  it("accepts configured production site origins", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_SITE_URL = "https://surmakuulutus.ee";

    expect(isAllowedSubmissionOrigin(
      new Request("https://surmakuulutus.ee/api/ads", {
        method: "POST",
        headers: { origin: "https://surmakuulutus.ee" },
      }),
    )).toBe(true);
  });
});

describe("verifyTurnstileToken", () => {
  it("rejects verification when Turnstile secret is not configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;

    await expect(
      verifyTurnstileToken("token", "203.0.113.7", "surmakuulutus.ee", vi.fn()),
    ).resolves.toEqual({
      success: false,
      reason: "not_configured",
    });
  });

  it("accepts valid Turnstile tokens", async () => {
    process.env.TURNSTILE_SECRET_KEY = " secret \n";
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await expect(
      verifyTurnstileToken("valid-token", "203.0.113.7", "surmakuulutus.ee", fetchImpl),
    ).resolves.toEqual({ success: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
        body: expect.any(URLSearchParams),
      }),
    );
    const body = fetchImpl.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("secret")).toBe("secret");
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
      verifyTurnstileToken("used-token", "203.0.113.7", "surmakuulutus.ee", fetchImpl),
    ).resolves.toEqual({
      success: false,
      reason: "invalid",
      errorCodes: ["timeout-or-duplicate"],
    });
  });

  it("uses Cloudflare test secret on localhost outside production", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    vi.stubEnv("NODE_ENV", "development");
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await expect(
      verifyTurnstileToken("test-token", "127.0.0.1", "localhost", fetchImpl),
    ).resolves.toEqual({ success: true });

    const body = fetchImpl.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("secret")).toBe("1x0000000000000000000000000000000AA");
  });

  it("validates action and hostname in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = "surmakuulutus.ee";
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        action: "publish-obituary",
        hostname: "surmakuulutus.ee",
      }),
    });

    await expect(
      verifyTurnstileToken("valid-token", "203.0.113.7", "surmakuulutus.ee", fetchImpl),
    ).resolves.toEqual({ success: true });
  });

  it("rejects unexpected production action", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        action: "other-action",
        hostname: "surmakuulutus.ee",
      }),
    });

    await expect(
      verifyTurnstileToken("valid-token", "203.0.113.7", "surmakuulutus.ee", fetchImpl),
    ).resolves.toEqual({
      success: false,
      reason: "invalid_action",
      action: "other-action",
    });
  });

  it("rejects unexpected production hostname", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = "surmakuulutus.ee";
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        action: "publish-obituary",
        hostname: "evil.example",
      }),
    });

    await expect(
      verifyTurnstileToken("valid-token", "203.0.113.7", "surmakuulutus.ee", fetchImpl),
    ).resolves.toEqual({
      success: false,
      reason: "invalid_hostname",
      hostname: "evil.example",
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const createAd = vi.fn();
const listAds = vi.fn();
const protectObituarySubmission = vi.fn();

vi.mock("../../../lib/ads", () => ({
  createAd,
  listAds,
}));

vi.mock("../../../lib/submissionSecurity", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/submissionSecurity")>(
    "../../../lib/submissionSecurity",
  );

  return {
    ...actual,
    protectObituarySubmission,
  };
});

const validBody = {
  name: "Mari Mets",
  email: "mari@example.com",
  topText: "Teatame kurbusega",
  bottomText: "Leinavad lapsed",
  poem: "",
  turnstileToken: "valid-token",
  website: "",
};

function postRequest(body: unknown) {
  return new Request("https://surmakuulutus.ee/api/ads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.7",
    },
    body: JSON.stringify(body),
  });
}

function request(body: unknown, headers: HeadersInit) {
  return new Request("https://surmakuulutus.ee/api/ads", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/ads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAd.mockResolvedValue({ name: "Mari Mets", slug: "mari-mets" });
    protectObituarySubmission.mockResolvedValue({ allowed: true });
  });

  it("creates an obituary after security checks pass", async () => {
    const { POST } = await import("./route");
    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(201);
    expect(protectObituarySubmission).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ name: "Mari Mets", email: "mari@example.com" }),
      { turnstileToken: "valid-token", website: "" },
    );
    expect(createAd).toHaveBeenCalledWith(
      expect.not.objectContaining({
        turnstileToken: expect.anything(),
        website: expect.anything(),
      }),
    );
  });

  it("rejects non-json API posts before saving", async () => {
    const { POST } = await import("./route");
    const response = await POST(request("name=Mari", {
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://surmakuulutus.ee",
    }));

    expect(response.status).toBe(415);
    expect(protectObituarySubmission).not.toHaveBeenCalled();
    expect(createAd).not.toHaveBeenCalled();
  });

  it("rejects honeypot spam before saving", async () => {
    protectObituarySubmission.mockResolvedValue({
      allowed: false,
      status: 400,
      message: "Server error",
    });
    const { POST } = await import("./route");
    const response = await POST(postRequest({ ...validBody, website: "bot-site" }));

    expect(response.status).toBe(400);
    expect(createAd).not.toHaveBeenCalled();
  });

  it("rejects rate limited submissions before saving", async () => {
    protectObituarySubmission.mockResolvedValue({
      allowed: false,
      status: 429,
      message: "Too many submissions",
    });
    const { POST } = await import("./route");
    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(429);
    expect(createAd).not.toHaveBeenCalled();
  });

  it("rejects invalid Turnstile tokens before saving", async () => {
    protectObituarySubmission.mockResolvedValue({
      allowed: false,
      status: 400,
      message: "Verification failed",
    });
    const { POST } = await import("./route");
    const response = await POST(postRequest({ ...validBody, turnstileToken: "bad-token" }));

    expect(response.status).toBe(400);
    expect(createAd).not.toHaveBeenCalled();
  });

  it("rejects direct requests without Turnstile tokens before saving", async () => {
    protectObituarySubmission.mockResolvedValue({
      allowed: false,
      status: 400,
      message: "Verification failed",
    });
    const { POST } = await import("./route");
    const response = await POST(postRequest({ ...validBody, turnstileToken: undefined }));

    expect(response.status).toBe(400);
    expect(protectObituarySubmission).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ name: "Mari Mets" }),
      { turnstileToken: undefined, website: "" },
    );
    expect(createAd).not.toHaveBeenCalled();
  });

  it("rejects duplicate submissions before saving", async () => {
    protectObituarySubmission.mockResolvedValue({
      allowed: false,
      status: 409,
      message: "Duplicate submission",
    });
    const { POST } = await import("./route");
    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(409);
    expect(createAd).not.toHaveBeenCalled();
  });
});

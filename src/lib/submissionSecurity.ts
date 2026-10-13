import crypto from "node:crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";
import type { AdFormValues } from "./adValidation";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";
const TURNSTILE_DEV_TOKEN = "dev-turnstile-token";
const TURNSTILE_EXPECTED_ACTION = "publish-obituary";
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

export interface SubmissionSecurityFields {
  turnstileToken?: unknown;
  website?: unknown;
}

type SecurityEvent =
  | "origin_rejected"
  | "honeypot_rejected"
  | "rate_limit_rejected"
  | "turnstile_rejected"
  | "turnstile_not_configured"
  | "turnstile_token_reused"
  | "duplicate_rejected"
  | "submission_accepted";

type MongoError = Error & { code?: number };

const rateLimitSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { collection: "submission_rate_limits" },
);

const tokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { collection: "submission_turnstile_tokens" },
);

const duplicateSchema = new mongoose.Schema(
  {
    fingerprint: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { collection: "submission_duplicates" },
);

const RateLimitModel =
  mongoose.models.SubmissionRateLimit ??
  mongoose.model("SubmissionRateLimit", rateLimitSchema);
const TokenModel =
  mongoose.models.SubmissionTurnstileToken ??
  mongoose.model("SubmissionTurnstileToken", tokenSchema);
const DuplicateModel =
  mongoose.models.SubmissionDuplicate ??
  mongoose.model("SubmissionDuplicate", duplicateSchema);

function hash(value: string) {
  const salt = process.env.SECURITY_LOG_SALT ?? process.env.AI_GENERATION_SECRET ?? "default";

  return crypto.createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

function getClientIpInfo(request: Request) {
  const netlifyIp = request.headers.get("x-nf-client-connection-ip")?.trim();
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const selected =
    netlifyIp ??
    cloudflareIp ??
    forwardedFor ??
    realIp ??
    "unknown";
  const source = netlifyIp
    ? "x-nf-client-connection-ip"
    : cloudflareIp
      ? "cf-connecting-ip"
      : forwardedFor
        ? "x-forwarded-for"
        : realIp
          ? "x-real-ip"
          : "unknown";

  return { selected, source };
}

function logSecurityEvent(event: SecurityEvent, request: Request, details: Record<string, unknown> = {}) {
  const ipInfo = getClientIpInfo(request);

  console.info("security.submission", {
    timestamp: new Date().toISOString(),
    event,
    endpoint: new URL(request.url).pathname,
    source: "manual",
    ipHash: hash(ipInfo.selected),
    ipSource: ipInfo.source,
    path: new URL(request.url).pathname,
    ...details,
  });
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as MongoError).code === 11000
  );
}

function getAllowedOrigins() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://surmakuulutus.ee";
  const origins = new Set<string>();

  for (const value of [
    configuredSiteUrl,
    "https://surmakuulutus.ee",
    "https://www.surmakuulutus.ee",
  ]) {
    try {
      origins.add(new URL(value).origin);
    } catch {
      // Ignore invalid optional configuration and keep built-in production origins.
    }
  }

  return origins;
}

export function isAllowedSubmissionOrigin(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  return getAllowedOrigins().has(origin);
}

export function getClientIp(request: Request) {
  return getClientIpInfo(request).selected;
}

export function getSecurityFields(body: Record<string, unknown>): SubmissionSecurityFields {
  return {
    turnstileToken: body.turnstileToken,
    website: body.website,
  };
}

export function stripSecurityFields(body: Record<string, unknown>) {
  const { turnstileToken, website, ...adPayload } = body;
  void turnstileToken;
  void website;

  return adPayload;
}

function getExpectedHostnames() {
  return (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "surmakuulutus.ee,www.surmakuulutus.ee")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);
}

function isLocalDevelopmentHost(hostname: string) {
  const normalized = hostname.toLowerCase();

  return (
    process.env.NODE_ENV === "development" &&
    (normalized === "localhost" ||
      normalized === "127.0.0.1" ||
      normalized === "::1")
  );
}

function getTurnstileSecret(requestHostname: string) {
  if (isLocalDevelopmentHost(requestHostname)) {
    return TURNSTILE_TEST_SECRET_KEY;
  }

  return process.env.TURNSTILE_SECRET_KEY?.trim();
}

export async function verifyTurnstileToken(
  token: string,
  ip: string,
  requestHostname: string,
  fetchImpl = fetch,
) {
  if (isLocalDevelopmentHost(requestHostname) && token === TURNSTILE_DEV_TOKEN) {
    return { success: true as const };
  }

  const secret = getTurnstileSecret(requestHostname);

  if (!secret) {
    return { success: false as const, reason: "not_configured" as const };
  }

  const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
    method: "POST",
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
      idempotency_key: crypto.randomUUID(),
    }),
  });

  if (!response.ok) {
    return { success: false as const, reason: "request_failed" as const };
  }

  const payload = (await response.json()) as {
    success?: boolean;
    "error-codes"?: string[];
    action?: string;
    hostname?: string;
  };

  if (!payload.success) {
    return {
      success: false as const,
      reason: "invalid" as const,
      errorCodes: payload["error-codes"] ?? [],
    };
  }

  if (process.env.NODE_ENV === "production") {
    if (payload.action !== TURNSTILE_EXPECTED_ACTION) {
      return {
        success: false as const,
        reason: "invalid_action" as const,
        action: payload.action,
      };
    }

    const hostname = payload.hostname?.toLowerCase();
    if (!hostname || !getExpectedHostnames().includes(hostname)) {
      return {
        success: false as const,
        reason: "invalid_hostname" as const,
        hostname: payload.hostname,
      };
    }
  }

  return { success: true as const };
}

export async function reserveTurnstileToken(token: string) {
  await connectToDatabase();

  try {
    await TokenModel.create({
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    });

    return true;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return false;
    }

    throw error;
  }
}

export async function checkSubmissionRateLimit(ip: string) {
  await connectToDatabase();

  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const key = hash(`${ip}:${Math.floor(now.getTime() / RATE_LIMIT_WINDOW_MS)}`);

  await RateLimitModel.deleteMany({ expiresAt: { $lte: now } });
  const record = await RateLimitModel.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(windowStart.getTime() + RATE_LIMIT_WINDOW_MS * 2) },
    },
    { new: true, upsert: true },
  ).lean<{ count: number }>();

  return {
    allowed: (record?.count ?? 0) <= RATE_LIMIT_MAX,
    remaining: Math.max(RATE_LIMIT_MAX - (record?.count ?? 0), 0),
  };
}

export async function reserveSubmissionFingerprint(values: AdFormValues, ip: string) {
  await connectToDatabase();

  const normalized = JSON.stringify({
    ip: hash(ip),
    name: values.name.toLowerCase(),
    email: values.email.toLowerCase(),
    topText: values.topText.toLowerCase(),
    bottomText: values.bottomText.toLowerCase(),
    poem: values.poem.toLowerCase(),
    birthYear: values.birthYear ? String(values.birthYear) : "",
    deathYear: values.deathYear ? String(values.deathYear) : "",
  });

  try {
    await DuplicateModel.create({
      fingerprint: hash(normalized),
      expiresAt: new Date(Date.now() + DUPLICATE_WINDOW_MS),
    });

    return true;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return false;
    }

    throw error;
  }
}

export async function protectObituarySubmission(
  request: Request,
  values: AdFormValues,
  fields: SubmissionSecurityFields,
) {
  const ip = getClientIp(request);
  const honeypotValue = typeof fields.website === "string" ? fields.website.trim() : "";

  if (!isAllowedSubmissionOrigin(request)) {
    logSecurityEvent("origin_rejected", request, {
      verificationResult: "not_checked",
      reason: "invalid_origin",
    });
    return { allowed: false as const, status: 403, message: "Server error" };
  }

  if (honeypotValue) {
    logSecurityEvent("honeypot_rejected", request, {
      verificationResult: "not_checked",
      reason: "honeypot",
    });
    return { allowed: false as const, status: 400, message: "Server error" };
  }

  if (typeof fields.turnstileToken !== "string" || fields.turnstileToken.length === 0) {
    logSecurityEvent("turnstile_rejected", request, {
      verificationResult: "rejected",
      reason: "missing",
    });
    return { allowed: false as const, status: 400, message: "Verification failed" };
  }

  const requestHostname = new URL(request.url).hostname;
  const turnstileResult = await verifyTurnstileToken(fields.turnstileToken, ip, requestHostname);
  if (!turnstileResult.success) {
    logSecurityEvent(
      turnstileResult.reason === "not_configured"
        ? "turnstile_not_configured"
        : "turnstile_rejected",
      request,
      { verificationResult: "rejected", reason: turnstileResult.reason },
    );
    return {
      allowed: false as const,
      status: turnstileResult.reason === "not_configured" ? 503 : 400,
      message: "Verification failed",
    };
  }

  const tokenReserved = await reserveTurnstileToken(fields.turnstileToken);
  if (!tokenReserved) {
    logSecurityEvent("turnstile_token_reused", request, {
      verificationResult: "rejected",
      reason: "token_reused",
    });
    return { allowed: false as const, status: 400, message: "Verification failed" };
  }

  const rateLimit = await checkSubmissionRateLimit(ip);
  if (!rateLimit.allowed) {
    logSecurityEvent("rate_limit_rejected", request, {
      verificationResult: "accepted",
      reason: "rate_limited",
    });
    return { allowed: false as const, status: 429, message: "Too many submissions" };
  }

  const duplicateReserved = await reserveSubmissionFingerprint(values, ip);
  if (!duplicateReserved) {
    logSecurityEvent("duplicate_rejected", request, {
      verificationResult: "accepted",
      reason: "duplicate_submission",
    });
    return { allowed: false as const, status: 409, message: "Duplicate submission" };
  }

  logSecurityEvent("submission_accepted", request, {
    verificationResult: "accepted",
    rateLimitRemaining: rateLimit.remaining,
  });

  return { allowed: true as const };
}

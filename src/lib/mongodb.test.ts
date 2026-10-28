import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureMongoDns } from "./mongoDns.mjs";

const mocks = vi.hoisted(() => ({ connect: vi.fn(), setServers: vi.fn() }));
vi.mock("mongoose", () => ({ default: { connect: mocks.connect } }));
vi.mock("node:dns/promises", () => ({ default: { setServers: mocks.setServers } }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  delete globalThis.mongooseCache;
  vi.stubEnv("MONGO_URI", "mongodb://localhost/isolated-test");
  vi.stubEnv("MONGO_DNS_SERVERS", "");
});
afterEach(() => { delete globalThis.mongooseCache; vi.unstubAllEnvs(); });

describe("MongoDB connection recovery", () => {
  it("retries after a failed connection instead of retaining the rejected promise", async () => {
    const connected = { connection: {} };
    mocks.connect.mockRejectedValueOnce(new Error("querySrv ECONNREFUSED")).mockResolvedValueOnce(connected);
    const { connectToDatabase } = await import("./mongodb");
    await expect(connectToDatabase()).rejects.toThrow("ECONNREFUSED");
    expect(await connectToDatabase()).toBe(connected);
    expect(await connectToDatabase()).toBe(connected);
    expect(mocks.connect).toHaveBeenCalledTimes(2);
  });

  it("shares an in-flight connection across concurrent requests and module reloads", async () => {
    const connected = { connection: {} };
    mocks.connect.mockResolvedValue(connected);
    const first = await import("./mongodb");
    const pending = first.connectToDatabase();
    vi.resetModules();
    const second = await import("./mongodb");
    expect(await Promise.all([pending, second.connectToDatabase()])).toEqual([connected, connected]);
    expect(mocks.connect).toHaveBeenCalledTimes(1);
  });
});

describe("optional MongoDB DNS override", () => {
  it("keeps host DNS unchanged unless configured", () => {
    configureMongoDns();
    expect(mocks.setServers).not.toHaveBeenCalled();
  });

  it("applies configured DNS server addresses", () => {
    vi.stubEnv("MONGO_DNS_SERVERS", "1.1.1.1, 1.0.0.1");
    configureMongoDns();
    expect(mocks.setServers).toHaveBeenCalledWith(["1.1.1.1", "1.0.0.1"]);
  });
});

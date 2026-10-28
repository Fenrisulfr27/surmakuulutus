import { isIP } from "node:net";

/** @param {string} value */
export function normalizeSubmitterIp(value) {
  const ip = value.trim();
  const version = isIP(ip);
  if (!version || ip.includes("%")) return undefined;
  return version === 6 ? new URL(`http://[${ip}]/`).hostname.slice(1, -1) : ip;
}


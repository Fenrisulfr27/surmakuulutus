import dns from "node:dns/promises";

export function configureMongoDns() {
  const servers = process.env.MONGO_DNS_SERVERS?.trim();
  if (servers) dns.setServers(servers.split(",").map((server) => server.trim()));
}

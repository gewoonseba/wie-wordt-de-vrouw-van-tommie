import net from "node:net";

import { describe, expect, it } from "vitest";

import {
  isPortAvailable,
  parsePreferredPort,
  selectDevPorts
} from "../scripts/dev-ports.mjs";

function listen(server, options) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(options, resolve);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

describe("dynamic development ports", () => {
  it("keeps the familiar defaults when they are available", async () => {
    await expect(selectDevPorts({ isAvailable: async () => true })).resolves.toEqual({
      public: 3000,
      next: 3001,
      convexCloud: 3210,
      convexSite: 3211
    });
  });

  it("walks past occupied and already reserved ports", async () => {
    const occupied = new Set([3000, 3001, 3210, 3211]);

    await expect(
      selectDevPorts({ isAvailable: async (port) => !occupied.has(port) })
    ).resolves.toEqual({
      public: 3002,
      next: 3003,
      convexCloud: 3212,
      convexSite: 3213
    });
  });

  it("detects a port occupied only through the IPv6 wildcard", async () => {
    const holder = net.createServer();
    await listen(holder, { host: "::", port: 0, ipv6Only: true });

    try {
      const address = holder.address();
      expect(typeof address).toBe("object");
      await expect(isPortAvailable(address.port)).resolves.toBe(false);
    } finally {
      await close(holder);
    }
  });

  it("accepts preferred starting ports and rejects invalid values", () => {
    expect(parsePreferredPort("4100", "DEV_PORT", 3000)).toBe(4100);
    expect(parsePreferredPort(undefined, "DEV_PORT", 3000)).toBe(3000);
    expect(() => parsePreferredPort("not-a-port", "DEV_PORT", 3000)).toThrow(
      "DEV_PORT must be an integer between 1 and 65535."
    );
  });
});

import net from "node:net";

const MAX_PORT = 65_535;

export function parsePreferredPort(value, label, fallback) {
  const port = value === undefined || value === "" ? fallback : Number(value);
  if (!Number.isInteger(port) || port < 1 || port > MAX_PORT) {
    throw new Error(`${label} must be an integer between 1 and ${MAX_PORT}.`);
  }
  return port;
}

function canBind(port, host, options = {}) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (error) => {
      const unsupportedAddressFamily =
        error.code === "EAFNOSUPPORT" || error.code === "EADDRNOTAVAIL";
      resolve(options.optional && unsupportedAddressFamily);
    });
    server.listen({ host, port, exclusive: true, ...options.listen }, () => {
      server.close(() => resolve(true));
    });
  });
}

export async function isPortAvailable(port) {
  if (!await canBind(port, "0.0.0.0")) {
    return false;
  }

  return await canBind(port, "::", {
    optional: true,
    listen: { ipv6Only: true }
  });
}

async function findAvailablePort(startPort, reserved, checkAvailability) {
  for (let port = startPort; port <= MAX_PORT; port += 1) {
    if (!reserved.has(port) && await checkAvailability(port)) {
      reserved.add(port);
      return port;
    }
  }
  throw new Error(`No available port found at or above ${startPort}.`);
}

export async function selectDevPorts({
  publicPort = 3000,
  nextPort = 3001,
  convexCloudPort = 3210,
  convexSitePort = 3211,
  isAvailable = isPortAvailable
} = {}) {
  const reserved = new Set();
  const publicSelected = await findAvailablePort(publicPort, reserved, isAvailable);
  const nextSelected = await findAvailablePort(nextPort, reserved, isAvailable);
  const convexCloudSelected = await findAvailablePort(
    convexCloudPort,
    reserved,
    isAvailable
  );
  const convexSiteSelected = await findAvailablePort(
    convexSitePort,
    reserved,
    isAvailable
  );

  return {
    public: publicSelected,
    next: nextSelected,
    convexCloud: convexCloudSelected,
    convexSite: convexSiteSelected
  };
}

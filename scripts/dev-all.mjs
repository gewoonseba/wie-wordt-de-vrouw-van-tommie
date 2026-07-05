import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const PUBLIC_PORT = 3000;
const NEXT_PORT = 3001;
const CONVEX_PORT = 3210;
const children = new Set();

function start(name, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: process.platform === "win32",
    ...options
  });

  children.add(child);

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("exit", (code, signal) => {
    children.delete(child);
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      stopAll();
      process.exit(code);
    }
    if (signal) {
      console.error(`[${name}] exited with signal ${signal}`);
    }
  });

  return child;
}

function normalizeConvexUrl() {
  const envPath = ".env.local";
  if (!existsSync(envPath)) {
    return false;
  }

  const env = readFileSync(envPath, "utf8");
  if (!env.includes("NEXT_PUBLIC_CONVEX_URL=")) {
    return false;
  }

  const normalized = env.replace(
    /^NEXT_PUBLIC_CONVEX_URL=.*$/m,
    "NEXT_PUBLIC_CONVEX_URL=same-origin"
  );

  if (normalized !== env) {
    writeFileSync(envPath, normalized);
  }

  return true;
}

async function waitForConvexEnv() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (normalizeConvexUrl()) {
      return;
    }
    await delay(250);
  }

  console.warn(
    "[dev:all] NEXT_PUBLIC_CONVEX_URL was not found yet; starting Next anyway."
  );
}

function stopAll() {
  for (const child of children) {
    child.kill("SIGINT");
  }
  proxy?.close();
}

function proxyTarget(url = "/") {
  if (url.startsWith("/convex/")) {
    return {
      port: CONVEX_PORT,
      path: url.slice("/convex".length) || "/"
    };
  }

  return {
    port: NEXT_PORT,
    path: url
  };
}

function startProxy() {
  const server = http.createServer((request, response) => {
    const target = proxyTarget(request.url);
    const headers = {
      ...request.headers,
      host: `localhost:${target.port}`
    };

    const proxyRequest = http.request(
      {
        hostname: "127.0.0.1",
        port: target.port,
        method: request.method,
        path: target.path,
        headers
      },
      (proxyResponse) => {
        response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
        proxyResponse.pipe(response);
      }
    );

    proxyRequest.on("error", (error) => {
      response.writeHead(502, { "content-type": "text/plain" });
      response.end(`Proxy error: ${error.message}`);
    });

    request.pipe(proxyRequest);
  });

  server.on("upgrade", (request, socket, head) => {
    const target = proxyTarget(request.url);
    const upstream = net.connect(target.port, "127.0.0.1", () => {
      upstream.write(
        `${request.method} ${target.path} HTTP/${request.httpVersion}\r\n`
      );

      for (const [name, value] of Object.entries(request.headers)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            upstream.write(`${name}: ${item}\r\n`);
          }
        } else if (value !== undefined) {
          upstream.write(
            `${name}: ${name.toLowerCase() === "host" ? `localhost:${target.port}` : value}\r\n`
          );
        }
      }

      upstream.write("\r\n");
      upstream.write(head);
      upstream.pipe(socket);
      socket.pipe(upstream);
    });

    upstream.on("error", () => {
      socket.destroy();
    });
  });

  server.listen(PUBLIC_PORT, "0.0.0.0", () => {
    console.log(
      `[proxy] http://localhost:${PUBLIC_PORT} -> Next ${NEXT_PORT}, /convex -> Convex ${CONVEX_PORT}`
    );
  });

  server.on("error", (error) => {
    console.error(`[proxy] ${error.message}`);
    stopAll();
    process.exit(1);
  });

  return server;
}

let proxy;

process.on("SIGINT", () => {
  stopAll();
  process.exit(130);
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit(143);
});

console.log("[dev:all] Starting Convex and Next.js...");
start("convex", "npm", ["run", "convex:dev"]);
await waitForConvexEnv();
const normalizeTimer = setInterval(normalizeConvexUrl, 1000);
proxy = startProxy();
start("next", "npm", ["run", "dev", "--", "--port", String(NEXT_PORT)], {
  env: {
    ...process.env,
    NEXT_PUBLIC_CONVEX_URL: "same-origin"
  }
});

process.on("exit", () => {
  clearInterval(normalizeTimer);
});

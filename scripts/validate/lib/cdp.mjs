import { browserStartupTimeoutMs } from "./config.mjs";
import { sleep, waitFor } from "./utils.mjs";

export class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.socket = null;
    this.nextId = 0;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.wsUrl);

    await new Promise((resolve, reject) => {
      const onOpen = () => {
        this.socket.removeEventListener("error", onError);
        resolve();
      };
      const onError = (event) => {
        this.socket.removeEventListener("open", onOpen);
        reject(event.error ?? new Error("Failed to open CDP socket"));
      };

      this.socket.addEventListener("open", onOpen);
      this.socket.addEventListener("error", onError);
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          reject(new Error(message.error.message));
          return;
        }
        resolve(message.result);
      }
    });
  }

  async send(method, params = {}) {
    const id = ++this.nextId;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "CDP evaluation failed");
    }

    return result.result?.value;
  }

  async reload() {
    await this.send("Page.reload");
  }

  async close() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.close();
      await sleep(50);
    }
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.json();
}

function formatBrowserDiagnostics(browserState) {
  const diagnostics = [];

  if (browserState.exitCode !== null) {
    diagnostics.push(`Browser exited with code ${browserState.exitCode}.`);
  }

  if (browserState.signal !== null) {
    diagnostics.push(`Browser exited with signal ${browserState.signal}.`);
  }

  const stderr = browserState.stderr.trim();
  if (stderr) {
    diagnostics.push(`Browser stderr:\n${stderr}`);
  }

  const stdout = browserState.stdout.trim();
  if (stdout) {
    diagnostics.push(`Browser stdout:\n${stdout}`);
  }

  return diagnostics.length > 0 ? diagnostics.join("\n\n") : null;
}

export async function waitForDebugger(port, browserState) {
  return waitFor(
    "Chrome DevTools endpoint",
    () => fetchJson(`http://127.0.0.1:${port}/json/version`),
    (value) => {
      if (browserState.exitCode !== null || browserState.signal !== null) {
        const diagnostics = formatBrowserDiagnostics(browserState);
        throw new Error(diagnostics ?? "Browser exited before DevTools became ready.");
      }

      return Boolean(value?.webSocketDebuggerUrl);
    },
    browserStartupTimeoutMs
  );
}

export async function listTargets(port) {
  return fetchJson(`http://127.0.0.1:${port}/json/list`);
}

export async function waitForTarget(port, predicate, description, timeoutMs = 15000) {
  return waitFor(
    description,
    async () => {
      const targets = await listTargets(port);
      return targets.find(predicate) ?? null;
    },
    (value) => Boolean(value),
    timeoutMs
  );
}

export async function connectToTarget(target) {
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();

  if (target.type === "page") {
    await client.send("Page.enable");
  }
  await client.send("Runtime.enable");
  return client;
}

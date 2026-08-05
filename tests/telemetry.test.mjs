import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";

const port = 3217;
const origin = `http://127.0.0.1:${port}`;
const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "agroos-test-"));
const databasePath = path.join(testDirectory, "agroos.sqlite");
const server = spawn(process.execPath, [".next/standalone/server.js"], {
  env: {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    AGROOS_DEVICE_KEY: "test-device-key",
    AGROOS_DB_PATH: databasePath,
  },
  stdio: "ignore",
});

async function waitUntilReady() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("AgroOS test server did not become ready");
}

test.before(async () => {
  await waitUntilReady();
});

test.after(() => {
  server.kill("SIGTERM");
  fs.rmSync(testDirectory, { recursive: true, force: true });
});

test("health reports SQLite storage", async () => {
  const response = await fetch(`${origin}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "agroos", storage: "sqlite" });
});

test("telemetry rejects a wrong device key", async () => {
  const response = await fetch(`${origin}/api/telemetry`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-agroos-device-key": "wrong" },
    body: JSON.stringify({
      deviceId: "clm-01",
      messageId: "clm-01:test:unauthorized",
      sequence: 1,
      temperatureC: 24.5,
      humidityPct: 58.2,
    }),
  });
  assert.equal(response.status, 401);
});

test("telemetry is stored once and returned as history", async () => {
  const payload = {
    deviceId: "clm-01",
    messageId: "clm-01:test:accepted",
    sequence: 2,
    temperatureC: 24.5,
    humidityPct: 58.2,
    rssiDbm: -45,
    uptimeSeconds: 123,
    firmwareVersion: "0.6.0",
  };
  const headers = { "content-type": "application/json", "x-agroos-device-key": "test-device-key" };
  const first = await fetch(`${origin}/api/telemetry`, { method: "POST", headers, body: JSON.stringify(payload) });
  assert.equal(first.status, 201);
  assert.equal((await first.json()).duplicate, false);

  const duplicate = await fetch(`${origin}/api/telemetry`, { method: "POST", headers, body: JSON.stringify(payload) });
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).duplicate, true);

  const history = await fetch(`${origin}/api/telemetry?deviceId=clm-01&range=24h`);
  const data = await history.json();
  assert.equal(data.count, 1);
  assert.equal(data.latest.temperatureC, 24.5);
  assert.equal(data.latest.humidityPct, 58.2);
  assert.equal(data.series[0].rssiDbm, -45);
});

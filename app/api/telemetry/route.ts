import { getDatabase } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEVICE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,47}$/i;
const MESSAGE_ID_PATTERN = /^[a-z0-9][a-z0-9:._-]{3,95}$/i;
const ALLOWED_RANGES = new Map([
  ["1h", 60 * 60 * 1000],
  ["6h", 6 * 60 * 60 * 1000],
  ["24h", 24 * 60 * 60 * 1000],
  ["7d", 7 * 24 * 60 * 60 * 1000],
]);

type TelemetryPayload = {
  deviceId?: unknown;
  messageId?: unknown;
  sequence?: unknown;
  recordedAt?: unknown;
  temperatureC?: unknown;
  humidityPct?: unknown;
  rssiDbm?: unknown;
  uptimeSeconds?: unknown;
  firmwareVersion?: unknown;
};

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function optionalInteger(value: unknown) {
  if (value === undefined || value === null) return null;
  const parsed = finiteNumber(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const configuredKey = process.env.AGROOS_DEVICE_KEY;
  if (!configuredKey) return Response.json({ error: "ingest_not_configured" }, { status: 503 });
  if (request.headers.get("x-agroos-device-key") !== configuredKey) return unauthorized();

  let payload: TelemetryPayload;
  try {
    payload = (await request.json()) as TelemetryPayload;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const deviceId = typeof payload.deviceId === "string" ? payload.deviceId.trim() : "";
  const messageId = typeof payload.messageId === "string" ? payload.messageId.trim() : "";
  const sequence = optionalInteger(payload.sequence);
  const temperatureC = finiteNumber(payload.temperatureC);
  const humidityPct = finiteNumber(payload.humidityPct);
  const rssiDbm = optionalInteger(payload.rssiDbm);
  const uptimeSeconds = optionalInteger(payload.uptimeSeconds);
  const firmwareVersion = typeof payload.firmwareVersion === "string"
    ? payload.firmwareVersion.trim().slice(0, 48)
    : null;
  const recordedAt = typeof payload.recordedAt === "string" && !Number.isNaN(Date.parse(payload.recordedAt))
    ? new Date(payload.recordedAt).toISOString()
    : null;

  if (!DEVICE_ID_PATTERN.test(deviceId)) return Response.json({ error: "invalid_device_id" }, { status: 400 });
  if (!MESSAGE_ID_PATTERN.test(messageId)) return Response.json({ error: "invalid_message_id" }, { status: 400 });
  if (sequence === null || sequence < 0) return Response.json({ error: "invalid_sequence" }, { status: 400 });
  if (temperatureC === null || temperatureC < -40 || temperatureC > 125) {
    return Response.json({ error: "invalid_temperature" }, { status: 400 });
  }
  if (humidityPct === null || humidityPct < 0 || humidityPct > 100) {
    return Response.json({ error: "invalid_humidity" }, { status: 400 });
  }
  if (rssiDbm !== null && (rssiDbm < -127 || rssiDbm > 0)) {
    return Response.json({ error: "invalid_rssi" }, { status: 400 });
  }
  if (uptimeSeconds !== null && uptimeSeconds < 0) {
    return Response.json({ error: "invalid_uptime" }, { status: 400 });
  }

  const receivedAt = new Date().toISOString();
  const result = getDatabase().prepare(`
    INSERT OR IGNORE INTO telemetry_readings (
      device_id, message_id, sequence, recorded_at, received_at,
      temperature_c, humidity_pct, rssi_dbm, uptime_seconds, firmware_version, quality
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GOOD')
  `).run(
    deviceId,
    messageId,
    sequence,
    recordedAt,
    receivedAt,
    temperatureC,
    humidityPct,
    rssiDbm,
    uptimeSeconds,
    firmwareVersion,
  );

  return Response.json(
    { accepted: true, duplicate: result.changes === 0, receivedAt },
    { status: result.changes === 0 ? 200 : 201 },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deviceId = (url.searchParams.get("deviceId") ?? "clm-01").trim();
  const requestedRange = url.searchParams.get("range") ?? "24h";
  const range = ALLOWED_RANGES.has(requestedRange) ? requestedRange : "24h";

  if (!DEVICE_ID_PATTERN.test(deviceId)) return Response.json({ error: "invalid_device_id" }, { status: 400 });

  const duration = ALLOWED_RANGES.get(range)!;
  const since = new Date(Date.now() - duration).toISOString();
  const database = getDatabase();
  const latest = database.prepare(`
    SELECT
      id,
      device_id AS deviceId,
      message_id AS messageId,
      sequence,
      recorded_at AS recordedAt,
      received_at AS receivedAt,
      temperature_c AS temperatureC,
      humidity_pct AS humidityPct,
      rssi_dbm AS rssiDbm,
      uptime_seconds AS uptimeSeconds,
      firmware_version AS firmwareVersion,
      quality
    FROM telemetry_readings
    WHERE device_id = ?
    ORDER BY received_at DESC, id DESC
    LIMIT 1
  `).get(deviceId) ?? null;
  const series = database.prepare(`
    SELECT
      id,
      received_at AS receivedAt,
      temperature_c AS temperatureC,
      humidity_pct AS humidityPct,
      rssi_dbm AS rssiDbm,
      sequence
    FROM telemetry_readings
    WHERE device_id = ? AND received_at >= ?
    ORDER BY received_at ASC, id ASC
    LIMIT 2500
  `).all(deviceId, since);

  return Response.json(
    { deviceId, range, latest, series, count: series.length, generatedAt: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
